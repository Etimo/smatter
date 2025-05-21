import { Schema, Types, model } from "mongoose";

type IUser = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  bio?: string;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  displayName: string;
};

type INewUser = Omit<
  IUser,
  "_id" | "profilePictureUrl" | "bannerPictureUrl" | "bio"
>;

type IUpdateUser = Partial<INewUser>;

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String },
  profilePictureUrl: { type: String },
  bannerPictureUrl: { type: String },
  displayName: { type: String, required: true },
});

const User = model<IUser>("User", userSchema);
export { INewUser, IUpdateUser, IUser, User, userSchema };
