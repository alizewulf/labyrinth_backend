import { Controller , Get , NotFoundException, Req , UseGuards} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { UsersService } from "./users.service.js";
import type { Request } from "express";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Req() request: Request) {

    const user = await this.usersService.findById(request.user!.sub)
    
    if (!user) {
      throw new NotFoundException("User not found");
    }
   
    return user
  }
}

