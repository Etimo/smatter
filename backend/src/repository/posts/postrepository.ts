import { Types } from "mongoose";
import { INewPost, Post } from "../../model/post";

const save = async (post: INewPost) => {
  return new Post(post).save();
};

const getAll = async () => {
  const posts = await Post.find();
  return posts;
};

const getByAuthorIds = async (authorIds: Types.ObjectId[]) => {
  if (!authorIds.length) return [];

  const posts = await Post.find({
    authorId: { $in: authorIds }
  });

  return posts;
};

const deletePost = async (id: string) => {
  return Post.findByIdAndDelete(id);
};

const findById = async (id: string) => {
  return Post.findById(id);
};

export const PostRepository = { getAll, getByAuthorIds, save, deletePost, findById };
