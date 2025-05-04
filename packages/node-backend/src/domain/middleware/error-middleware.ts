import { NextFunction, Request, Response } from "express";

export const errorMiddleware = () => {
  return (error: Error, _req: Request, res: Response, next: NextFunction) => {
    console.error(error);

    switch (error.name) {
      case "not-found":
        return res.status(404).json({ error: "Not Found" });
      case "unauthorized":
        return res.status(401).json({ error: "Unauthorized" });
      case "forbidden":
        return res.status(403).json({ error: "Forbidden" });
      case "bad-request":
        return res.status(400).json({ error: "Bad Request" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  };
};
