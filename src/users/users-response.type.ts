import { User } from "./user.types.js";

export type UserResponse = Omit<User, "password_hash">;