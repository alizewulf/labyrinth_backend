import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { User, UserRegistration } from './user.types.js';
import { UserResponse } from './user.types.js';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto.js';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(): Promise<User[]> {
    const result = await this.database.query<User>('SELECT * FROM users');
    return result.rows;
  }

  async findById(id: number): Promise<UserResponse | null> {
    const result = await this.database.query<UserResponse>(
      `SELECT 
      id, name, surname, birthdate, phone, city, email, role, created_at, updated_at 
      FROM users WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.database.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return result.rows[0] ?? null;
  }
  async updateMyProfile(
    userId: number,
    data: { name?: string; surname?: string },
  ): Promise<UserResponse | null> {
    const result = await this.database.query<UserResponse>(
      `
      UPDATE users
      SET
        name = COALESCE($1, name),
        surname = COALESCE($2, surname),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id, name, surname, birthdate, phone, city,
        email, role, created_at, updated_at
    `,
      [data.name ?? null, data.surname ?? null, userId],
    );

    return result.rows[0] ?? null;
  }
  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const result = await this.database.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId],
    );

    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.database.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [newPasswordHash, userId],
    );

    return { message: 'Password changed successfully' };
  }

  async create(user: UserRegistration): Promise<User> {
    const result = await this.database.query<User>(
      `
        INSERT INTO users (
            name,
            surname,
            phone,
            email,
            role,
            password_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
      [
        user.name,
        user.surname,
        user.phone,
        user.email,
        user.role,
        user.password,
      ],
    );

    return result.rows[0];
  }
}
