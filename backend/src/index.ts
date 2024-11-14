import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import httpContext from "express-http-context";
import { createAuthRoutes } from "./controllers/auth/controller";
import { createPostRoutes } from "./controllers/posts/controller";
import { createUserRoutes } from "./controllers/users/controller";
import { createFollowerRoutes } from "./followers/controller"
import { connectDb } from "./domain/configuration/mongo";
import { errorMiddleware } from "./domain/middleware/error-middleware";

const app = express();
const port = 3001;

dotenv.config();

app.use(express.json());
connectDb(process.env.MONGO_DB_CONNECTION_STRING ?? "");
//Seed DB with a set of users and comments

// https://expressjs.com/en/resources/middleware/cors.html
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["cookie", "content-type"],
    exposedHeaders: "*",
    credentials: true,
    preflightContinue: true,
    methods: "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(httpContext.middleware);

app.use("/users", createUserRoutes());
app.use("/posts", createPostRoutes());
app.use("/auth", createAuthRoutes());
app.use("/followers", createFollowerRoutes());

app.listen(port, () => {
  console.log(`Api listening on port ${port}`);
});

app.use(errorMiddleware());
