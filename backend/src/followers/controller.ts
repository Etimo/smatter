import { Request, Response, Router } from "express";
import { Types } from "mongoose";
import { getContext } from "../context";
import { requestHandler } from "../controllers/request-handler";
import { validateRequest } from "../controllers/validate";
import { isObjectId } from "../utils/object-id-regex";
import { IFollowing } from "./followermodel";
import { FollowingRepository } from "./followerrepository";
import { FollowingDto, NewFollowingDto } from "./followertypes";

const followerRouter = Router();

const checkQueryParamObjectId = (param: any): boolean => {
  return !(typeof(param) !== "string" || !isObjectId(param))
}
export const createFollowerRoutes = ():Router => {
  followerRouter.get(
    "/",
    requestHandler(async (req: Request, resp: Response) => {
      //Get user ID from context in the future
      const ownerQuery = req.query.owningUserId;
      const followerQuery = req.query.followerId;

      //Validate any set query arguments
      if(ownerQuery && !checkQueryParamObjectId(ownerQuery) ||
       followerQuery && !checkQueryParamObjectId(followerQuery)) {
        resp.status(400).send({errorMessage: "Parameters must be valid objectIds"})
        return;
      }

      var following:IFollowing[]  = [];
      if(ownerQuery && typeof(ownerQuery) ===  "string") {
              following = await FollowingRepository.findByOwnerId(new Types.ObjectId(ownerQuery))
      }
      if(followerQuery && typeof(followerQuery) ===  "string") {
              following = await FollowingRepository.findByOwnerId(new Types.ObjectId(followerQuery))
      }

      const followingDtos = following.map((following) => {
        return {
          id: following._id.toString(),
          followingId: following.followingId,
          followerId: following.owningUserId,
        };
      });

      resp.send(followingDtos);
    })
  );

  followerRouter.post("/", async (req: Request, resp: Response) => {
    const validationResult = validateRequest(req.body, NewFollowingDto);

    if (!validationResult.success) {
      throw new Error(JSON.stringify(validationResult.errors));
    }
    const context = getContext()

    validationResult.result.owningUserId = context.user._id.toString()
    const saveResult = await FollowingRepository.save(
      //@ts-ignore solve a way of inferrnig objectID from the zod schema, or just pass a string
      FollowingRepository.mapToNew(validationResult.result)
    );
    const resultDto: FollowingDto = {
      id: saveResult._id.toString(),
      owningUserId: saveResult.followingId.toString(),
      followerId: saveResult.owningUserId.toString(),
    };
    return resultDto;
  });

return followerRouter;
}
