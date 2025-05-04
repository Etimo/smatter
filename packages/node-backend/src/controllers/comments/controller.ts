import { Request, Response, Router } from "express";
import { CommentRepository } from "../../repository/comments/commentrepository";
import { requestHandler } from "../request-handler";
import { validateRequest } from "../validate";
import { CommentDto, NewCommentDto } from "./types";

export const createCommentRoutes = (): Router => {
  const postRouter = Router();

  postRouter.get(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const posts = await CommentRepository.getAll();
      const postDtos: CommentDto[] = posts.map((user) => {
        return {
          id: user._id.toString(),
          content: user.content,
          authorId: user.authorId.toString(),
          postId: user.postId.toString(),
        };
      });

      res.send(postDtos);
    })
  );

  postRouter.post(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const validationResult = validateRequest(req.body, NewCommentDto);

      if (!validationResult.success) {
        throw new Error(JSON.stringify(validationResult.errors));
      }

      const saveResult = await CommentRepository.save(
        CommentRepository.mapToNew(validationResult.result)
      );

      const resultDto: CommentDto = {
        id: saveResult._id.toString(),
        content: saveResult.content,
        authorId: "",
        postId: "",
      };

      res.send(resultDto);
    })
  );

  return postRouter;
};
