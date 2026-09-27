import type { JwtPayload } from "../auth/jwt-payload.type.js";

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export {};