import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

import type { Request } from 'express';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() request: Request) {
    const user = await this.usersService.findById(request.user!.sub);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @UseGuards(JwtAuthGuard)
    @Patch('me/password')
    changePassword(
    @Req() request: Request,
    @Body() dto: ChangePasswordDto,
    ) {
    return this.usersService.changePassword(request.user!.sub, dto);
    }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Req() request: Request,
    @Body() dto: UpdateMyProfileDto,
  ) {
    const user = await this.usersService.updateMyProfile(
      request.user!.sub,
      dto,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
