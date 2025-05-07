import httpContext from "express-http-context";
import { IUser } from "./model/user";

// https://www.npmjs.com/package/express-http-context
type Context = {
  user: IUser;
};

export const setContext = (context: Partial<Context>) => {
  const current = httpContext.get("context") as Context;
  const updated = { ...current, ...context };
  httpContext.set("context", updated);
};

export const getContext = () => {
  return httpContext.get("context") as Context;
};
