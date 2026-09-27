import type { JwtPayload } from "./jwt-payload.type.js";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export {};