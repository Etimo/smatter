import { ObjectId, Schema, model } from "mongoose";

export type IFollowing = {
  _id: ObjectId;
  followingId: ObjectId;
  owningUserId: ObjectId;
};

export type INewFollowing = {
  followingId: ObjectId;
  owningUserId: ObjectId;
};

export const followerSchema = new Schema<IFollowing>({
  _id: { type: Schema.Types.ObjectId, required: true },
  followingId: { type: Schema.Types.ObjectId, required: true },
  owningUserId: { type: Schema.Types.ObjectId, required: true },
});

export const followerUpdateSchema = new Schema<IFollowing>({
  followingId: { type: Schema.Types.ObjectId, required: true },
  owningUserId: { type: Schema.Types.ObjectId, required: true },
});

export const Follower = model<IFollowing>("Follower", followerSchema);
