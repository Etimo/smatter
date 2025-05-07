import { connectDb } from "./mongo";
// let mongodbContainer: StartedMongoDBContainer;
beforeAll(async () => {
  /**
   * Note: Until I can fix testcontainers we can use a single testdb started by "npm run testdb"
   */
  /*mongodbContainer = await new MongoDBContainer("mongo:4.0.1").start();
 console.log("Started container on:"+mongodbContainer.getConnectionString)*/
}, 300000);

afterAll(async () => {
  //await mongodbContainer.stop();
});

it("should connect to mongodb", async () => {
  //const uri = mongodbContainer.getConnectionString()+"/smatter";
  const uri = "mongodb://fake:fake@127.0.0.1:27024";
  const connection = await connectDb(uri);
  console.log(connection);
  await connection.disconnect();
}, 3000000);
