import { Request, Response, Router } from "express";
import { Schema, Types } from "mongoose";
import { getContext } from "../context";
import { requestHandler } from "../controllers/request-handler";
import { ApiError } from "../errors";
import { isObjectId } from "../utils/object-id-regex";
import { IFollowing } from "./followermodel";
import { FollowingRepository } from "./followerrepository";

const followerRouter = Router();

const checkQueryParamObjectId = (param: any): boolean => {
  return !(typeof param !== "string" || !isObjectId(param));
};
export const createFollowerRoutes = (): Router => {
  followerRouter.get(
    "/",
    requestHandler(async (req: Request, resp: Response) => {
      const ownerQuery = req.query.owningUserId;
      const followerQuery = req.query.followingId;

      //Validate any set query arguments
      if (
        (ownerQuery && !checkQueryParamObjectId(ownerQuery)) ||
        (followerQuery && !checkQueryParamObjectId(followerQuery))
      ) {
        throw new ApiError("bad-request");
      }

      let following: IFollowing[] = [];

      if (ownerQuery && typeof ownerQuery === "string") {
        following = await FollowingRepository.findByOwnerId(
          new Types.ObjectId(ownerQuery)
        );
      }
      if (followerQuery && typeof followerQuery === "string") {
        following = await FollowingRepository.findByFollowingId(
          new Types.ObjectId(followerQuery)
        );
      }

      const followingDtos = following.map((following) => {
        return {
          id: following._id.toString(),
          followingId: following.followingId,
          owningUserId: following.owningUserId,
        };
      });

      resp.send(followingDtos);
    })
  );

  followerRouter.post(
    "/",
    requestHandler(async (req: Request, resp: Response) => {
      const followingId = req.body?.followingId;
      const context = getContext();

      //TODO: Validate user exists
      if (typeof followingId !== "string" || !isObjectId(followingId)) {
        throw new ApiError("bad-request");
      }

      const owningUserId = context.user._id.toString();

      const saveResult = await FollowingRepository.save({
        followingId: followingId as unknown as Schema.Types.ObjectId,
        owningUserId: owningUserId as unknown as Schema.Types.ObjectId,
      });

      const resultDto = {
        id: saveResult._id.toString(),
        followingId: saveResult.followingId.toString(),
        owningUserId: saveResult.owningUserId.toString(),
      };
      resp.send(resultDto);
    })
  );

  followerRouter.post(
    "/unfollow",
    requestHandler(async (req: Request, resp: Response) => {
      const context = getContext();

      const followingId = req.body?.followingId;
      if (typeof followingId !== "string" || !isObjectId(followingId)) {
        throw new ApiError("bad-request");
      }

      const owningUserId = context.user._id.toString();

      await FollowingRepository.deleteByOwnerIdAndFollowingId(
        new Types.ObjectId(owningUserId),
        new Types.ObjectId(followingId)
      );
      resp.send({ message: `removed ${followingId}` });
    })
  );

  return followerRouter;
};
