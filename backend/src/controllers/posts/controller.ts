import { Request, Response, Router } from "express";
import { getContext } from "../../context";
import { ApiError } from "../../errors";
import { Post } from "../../model/post";
import { PostRepository } from "../../repository/posts/postrepository";
import { UserRepository } from "../../repository/users/userrepository";
import { requestHandler } from "../request-handler";
import { validateId, validateRequest } from "../validate";
import { NewPostDtoSchema, PostDto } from "./types";

const users: {
  username: string;
  displayName: string;
}[] = [
    {
      username: "philipForsberg",
      displayName: "Prebenlover123",
    },
    {
      username: "chunkyCat42",
      displayName: "Round and proud",
    },
    {
      username: "ittybittykittycommittee",
      displayName: "Mr Meow",
    },
  ];

export const createPostRoutes = (): Router => {
  const postRouter = Router();

  postRouter.get(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const posts = await PostRepository.getAll();

      const uniqueAuthorIds = [...new Set(
        posts
          .filter(post => post.authorId)
          .map(post => post.authorId!.toString())
      )];

      const userMap = new Map()

      if (uniqueAuthorIds.length > 0) {
        const users = await UserRepository.getByIds(uniqueAuthorIds);

        users.forEach(user => {
          userMap.set(user._id.toString(), {
            username: user.username,
            displayName: user.displayName || user.username
          });
        });
      }

      const postDtos: PostDto[] = posts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((post) => {
          // get a random default user:
          const defaultUser = users[Math.floor(Math.random() * users.length)]

          const user = post.authorId
            ? userMap.get(post.authorId.toString())
            : defaultUser;

          return {
            id: post._id.toString(),
            content: post.content,
            authorId: post.authorId?.toString(),
            createdAt: post.createdAt,
            user
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
