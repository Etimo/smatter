type Error = "not-found" | "unauthorized" | "forbidden" | "bad-request";

export class ApiError extends Error {
  constructor(type: Error, message?: string) {
    super(message);
    this.name = type;
  }
}
