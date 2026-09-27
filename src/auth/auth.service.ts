import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly JwtService: JwtService
    ) {}

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

    async login(dto: LoginUserDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new ConflictException('Invalid email or password');
        }

        const isPasswordValid =  await bcrypt.compare(dto.password, user.password_hash)

        if (!isPasswordValid) {
            throw new ConflictException('Invalid email or password')
        }

        const accessToken = this.JwtService.sign({
            sub: user.id,
            emaiL: user.email,
            role: user.role
        })
        
        return [accessToken]
    }
}
