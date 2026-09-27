import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import type { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("register")
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Post("login")
    login(@Body() dto: LoginUserDto) {
        return this.authService.login(dto);
    }
}
