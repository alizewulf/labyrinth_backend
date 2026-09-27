import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";
import type { User } from "./user.types.js";

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  
  async findAll(): Promise<User[]> {
    const result = await this.database.query<User>("SELECT * FROM users");
    return result.rows;
  }
}