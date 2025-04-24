import mongoose from "mongoose";
import { NewUserDto } from "../../controllers/users/types";
import { INewUser, IUpdateUser, IUser, User } from "../../model/user";

const mapToNew = (user: NewUserDto): IUser => {
  return new User(user);
};

const create = async (user: INewUser) => {
  const mongoDoc = new User(user);
  return mongoDoc.save();
};

const getAll = async () => {
  const users = await User.find();
  return users.map(u => new User(u) as IUser);
};

const getById = async (id: string) => {
  return User.findById(id);
};

const getByIds = async (ids: string[]) => {
  if (ids.length === 0) {
    return [];
  }

  const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

  return User.find({
    _id: { $in: objectIds }
  });
};

const getByEmail = async (email: string) => {
  return User.findOne({ email });
};

const updateById = async (id: string, user: IUpdateUser) => {
  return User.findByIdAndUpdate(id, user, { new: true });
};

const search = async (query: string) => {
  const searchRegex = new RegExp(query, 'i');

  return User.find({
    $or: [
      { username: searchRegex },
      { email: searchRegex }
    ]
  })
    .select('username email')
    .exec();
};

export const UserRepository = {
  getAll,
  mapToNew,
  create,
  getById,
  getByIds,
  search,
  getByEmail,
  updateById,
};
