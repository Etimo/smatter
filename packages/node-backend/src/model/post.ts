import { Schema, Types, model } from "mongoose";

const postSchema = new Schema<IPost>(
  {
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, required: false },
  },
  {
    timestamps: true,
  }
);

type IPost = {
  _id: Types.ObjectId;
  content: string;
  authorId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type INewPost = Omit<IPost, "_id">;

const Post = model<IPost>("Post", postSchema);
export { INewPost, IPost, Post, postSchema };
