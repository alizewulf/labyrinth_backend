import type { JwtPayload } from "../auth/jwt/jwt-payload.type.ts";

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export {};