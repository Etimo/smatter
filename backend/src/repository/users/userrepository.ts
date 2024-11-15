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

const getByEmail = async (email: string) => {
  return User.findOne({ email });
};

const updateById = async (id: string, user: IUpdateUser) => {
  return User.findByIdAndUpdate(id, user, { new: true });
};

export const UserRepository = {
  getAll,
  mapToNew,
  create,
  getById,
  getByEmail,
  updateById,
};
