import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.usersService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginUserDto) {
        return this.usersService.login(dto);
    } 
}