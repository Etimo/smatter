import { NewCommentDto } from "backend/src/controllers/comments";
import { IComment, Comment } from "backend/src/model/comment";

const mapToNew = (user: NewCommentDto): IComment => {
  return new Comment(user);
};

const save = async (comment: IComment) => {
  const mongoDoc = new Comment(comment);
  return mongoDoc.save();
};

const getAll = async () => {
  const users = await Comment.find();
  return users;
};

export const CommentRepository = { getAll, mapToNew, save };
