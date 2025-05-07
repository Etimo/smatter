import mongoose from "mongoose";
import { connectDb } from "../../domain/configuration/mongo";
import { User } from "../../model/user";
let connection: typeof mongoose;
beforeAll(async () => {
  /**
   * Note: Until I can fix testcontainers we can use a single testdb started by "npm run testdb"
   */
  /*mongodbContainer = await new MongoDBContainer("mongo:4.0.1").start();
 console.log("Started container on:"+mongodbContainer.getConnectionString)*/
  const uri = "mongodb://fake:fake@127.0.0.1:27024";
  connection = await connectDb(uri);
  await User.deleteMany({});
}, 300000);

afterAll(async () => {
  //await mongodbContainer.stop();
  await connection.disconnect();
});

it("should connect to mongodb", async () => {
  console.log(connection);

  const user = await new User({
    email: "erik.coolguy@b-teamo.se",
    username: "CoolGuy81",
    password: "Passive"
  }).save();
  const userToo = await new User({
    email: "henrikue.loves.tik-tok@b-teamo.se",
    username: "TypeScriptIsBest",
    password: "Whoa"
  }).save();
  console.log(user.email, " : ", userToo.email);

  const firstUser = await await User.find({ email: user.email });
  expect(firstUser.length).toBe(1);

  const allUsers = await await User.find({});
  expect(allUsers.length).toBe(2);
}, 3000000);
