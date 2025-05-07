import mongoose from "mongoose";
//const uri = process.env.MONGO_DB_CONNECTION_STRING ?? "";

export const connectDb = async (connectionString: string) => {
  console.log("Connecting to", connectionString);
  const connection = await mongoose.connect(connectionString);
  return connection;
};
