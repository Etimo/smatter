import { Request, Response, Router } from "express";
import { getContext } from "../../context";
import { ApiError } from "../../errors";
import { Post } from "../../model/post";
import { PostRepository } from "../../repository/posts/postrepository";
import { requestHandler } from "../request-handler";
import { users } from "../users/constants";
import { validateId, validateRequest } from "../validate";
import { NewPostDtoSchema, PostDto } from "./types";

export const createPostRoutes = (): Router => {
  const postRouter = Router();

  postRouter.get(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const posts = await PostRepository.getAll();
      const postDtos: PostDto[] = posts
        .sort((a, b) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .map((post) => {
          return {
            id: post._id.toString(),
            content: post.content,
            authorId: post.authorId?.toString(),
            createdAt: post.createdAt,
            // get a random user:
            user: users[Math.floor(Math.random() * users.length)],
          };
        });

      res.send(postDtos);
    })
  );

  postRouter.post(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const validationResult = validateRequest(req.body, NewPostDtoSchema);

      if (!validationResult.success) {
        throw new ApiError("bad-request");
      }

      const { user } = getContext();

      const newPost = new Post({
        ...validationResult.result,
        authorId: user._id,
      });

      const saveResult = await PostRepository.save(newPost);

      const resultDto: PostDto = {
        id: saveResult._id.toString(),
        content: saveResult.content,
        authorId: saveResult.authorId?.toString(),
        createdAt: saveResult.createdAt,
      };

      res.send(resultDto);
    })
  );

  postRouter.delete(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const validId = validateId(req.body.id);
      if (!validId) {
        throw new ApiError("bad-request");
      }

      const ctx = getContext();
      const userId = ctx.user._id;

      const postToDelete = await PostRepository.findById(req.body.id);
      if (
        !postToDelete ||
        postToDelete.authorId?.toString() !== userId.toString()
      ) {
        throw new ApiError("not-found");
      }

      await PostRepository.deletePost(req.body.id);

      res.status(204).send();
    })
  );

  return postRouter;
};
