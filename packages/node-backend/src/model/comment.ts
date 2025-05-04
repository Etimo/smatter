import { Schema, Types, model } from "mongoose";
type IComment = {
  _id: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  postId: Types.ObjectId;
};

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, required: false },
  postId: { type: Schema.Types.ObjectId, required: false },
});

const Comment = model<IComment>("Comment", commentSchema);
export { IComment, Comment , commentSchema };
