import { Request, Response, Router } from "express";
import { Types } from "mongoose";
import { getContext } from "../../context";
import { FollowingRepository } from "../../followers/followerrepository";
import { IPost } from "../../model/post";
import { PostRepository } from "../../repository/posts/postrepository";
import { UserRepository } from "../../repository/users/userrepository";
import { PostDto } from "../posts/types";
import { requestHandler } from "../request-handler";
import { users } from "../users/constants";

export const createFeedRoutes = (): Router => {
  const feedRouter = Router();

  feedRouter.get(
    "/",
    requestHandler(async (req: Request, res: Response) => {
      const { following } = req.query;
      const user = getContext().user;

      const posts = await getPosts(following === "true", user._id);

      const postDtos = await enrichPostsWithUserData(posts);

      res.send(postDtos);
    })
  );

  return feedRouter;
};

async function getPosts(filterByFollowing: boolean, userId: Types.ObjectId): Promise<IPost[]> {
  if (!filterByFollowing) {
    return PostRepository.getAll();
  }

  const followedUsers = await FollowingRepository.findByOwnerId(userId);

  if (followedUsers.length === 0) {
    return [];
  }

  const followedUserIds = followedUsers.map(follow =>
    new Types.ObjectId(follow.followingId.toString())
  );

  return PostRepository.getByAuthorIds(followedUserIds);
}

async function enrichPostsWithUserData(posts: IPost[]): Promise<PostDto[]> {
  if (posts.length === 0) {
    return [];
  }

  const uniqueAuthorIds = [...new Set(
    posts
      .filter(post => post.authorId)
      .map(post => post.authorId!.toString())
  )];

  const userMap = new Map();

  if (uniqueAuthorIds.length > 0) {
    const dbUsers = await UserRepository.getByIds(uniqueAuthorIds);

    dbUsers.forEach(user => {
      userMap.set(user._id.toString(), {
        username: user.username,
        displayName: user.displayName || user.username
      });
    });
  }

  return posts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((post) => {
      const defaultUser = users[Math.floor(Math.random() * users.length)];

      const user = post.authorId
        ? userMap.get(post.authorId.toString()) || defaultUser
        : defaultUser;

      return {
        id: post._id.toString(),
        content: post.content,
        authorId: post.authorId?.toString(),
        createdAt: post.createdAt,
        user
      };
    });
}
