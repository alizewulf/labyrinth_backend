import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    register(dto: CreateUserDto) {
        return this.usersService.findAll();
    }

    login(dto: LoginUserDto) {
        return this.usersService.findAll();
    }
}
