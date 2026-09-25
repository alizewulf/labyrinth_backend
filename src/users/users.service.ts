import { Injectable } from "@nestjs/common";

import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { LoginUserDto } from "./dto/login-user.dto.js";
import type { User } from "./user.types.js";

@Injectable()
export class UsersService {
  findAll(): User[] {
    return [
      {
        id: 1,
        name: "Alize",
        surname: "Test",
        birthdate: "2006-02-14",
        phone: "555123456",
        city: "Tbilisi",
        email: "alize@example.com",
        role: "user",
        password_hash: "hashed-password",
        createdAt: "2026-09-25",
        updatedAt: "2026-09-25",
      },
    ];
  }

  register(dto: CreateUserDto): User {
    // droebiti
    throw new Error("Not implemented");
  }

  login(dto: LoginUserDto): User {
    // droebiti 
    throw new Error("Not implemented");
  }
}