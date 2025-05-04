import mongoose, { Types } from "mongoose";
import { connectDb } from "../../domain/configuration/mongo";
import { Post } from "../../model/post";
let connection: typeof mongoose;
beforeAll(async () => {
  const uri = "mongodb://fake:fake@127.0.0.1:27024";
  connection = await connectDb(uri);
  await Post.deleteMany({});
}, 300000);

afterAll(async () => {
  //await mongodbContainer.stop();
  await connection.disconnect();
});

it("should connect to mongodb", async () => {
  const authorId: Types.ObjectId = new Types.ObjectId();

  await new Post({
    authorId,
    content: "Hello, this is a post",
  }).save();

  await new Post({
    authorId,
    content: "Hello, this is a post",
  }).save();

  const allUsers = await Post.find({});
  expect(allUsers.length).toBe(2);
}, 3000000);
