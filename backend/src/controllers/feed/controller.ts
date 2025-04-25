import { Request, Response, Router } from "express";
import { PostRepository } from "../../repository/posts/postrepository";
import { UserRepository } from "../../repository/users/userrepository";
import { PostDto } from "../posts/types";
import { requestHandler } from "../request-handler";
import { users } from "../users/constants";

export const createFeedRoutes = (): Router => {
  const feedRouter = Router();

  // TODO: Revert back to original code?!
  feedRouter.get(
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

  return feedRouter;
};
