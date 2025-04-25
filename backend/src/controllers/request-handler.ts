import { NextFunction, Request, Response } from "express";
import { setContext } from "../context";
import { UserRepository } from "../repository/users/userrepository";
import { fromBase64 } from "../utils/base64-helper";

export const requestHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  options?: { isPublic?: boolean }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(
      `${req.method} ${req.url} ${JSON.stringify(req.body, null, 2)}`
    );
    if (!options?.isPublic) await authenticate(req, res);

    try {
      await fn(req, res, next);
    } catch (e) {
      next(e); // Only call next() for errors
    }
  };
};

const authenticate = async (req: Request, res: Response) => {
  if (req.method === "OPTIONS") true;

  const sessionCookie = req.headers["cookie"];
  if (!sessionCookie) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sessionCookieMatch = sessionCookie.match(/session=([^;].+)/);
  if (!sessionCookieMatch) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = fromBase64(sessionCookieMatch[1]);
  const user = await UserRepository.getById(userId);

  if (!user) {
    console.log(`No user with id ${userId} in db`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  setContext({ user });
  return true;
};
