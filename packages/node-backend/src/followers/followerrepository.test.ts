import mongoose, { Types } from "mongoose";
import { connectDb } from "../domain/configuration/mongo";
import { Follower } from "./followermodel";
let connection: typeof mongoose;
beforeAll(async () => {
  /**
   * Note: Until I can fix testcontainers we can use a single testdb started by "npm run testdb"
   */
  /*mongodbContainer = await new MongoDBContainer("mongo:4.0.1").start();
 console.log("Started container on:"+mongodbContainer.getConnectionString)*/
  const uri = "mongodb://fake:fake@127.0.0.1:27024";
  connection = await connectDb(uri);
  await Follower.deleteMany({});
}, 300000);

afterAll(async () => {
  //await mongodbContainer.stop();
  await connection.disconnect();
});

it("should connect to mongodb", async () => {
  console.log(connection);
  const ownerId =
      new Types.ObjectId()
  const followingIds =
      [ new Types.ObjectId(), new Types.ObjectId, new Types.ObjectId ]
   for(const f of followingIds) {


   const tmp = await new Follower({
    _id: new Types.ObjectId(),
    owningUserId: ownerId,
    followingId: f
  }).save();
  }

  const allUsers = await await Follower.find({ owningUserId: ownerId });
  expect(allUsers.length).toBe(3);

}, 3000000);
