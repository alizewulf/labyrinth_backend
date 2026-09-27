import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async register(dto: CreateUserDto) {
        const existingUser = await this.usersService.findByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }
        
        const passwordHash = await bcrypt.hash(dto.password, 10)

        return this.usersService.create({
            ...dto,
            password: passwordHash
        })
    }

    login(dto: LoginUserDto) {
        return this.usersService.findAll();
    }
}
