import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { User, UserRegistration } from './user.types.js';
import { UserResponse } from './user.types.js';

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

  async create(user: UserRegistration): Promise<User> {
    const result = await this.database.query<User>(
      `
      INSERT INTO users (
      name, surname, birthdate, phone, city, email, role, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        user.name,
        user.surname,
        user.birthdate,
        user.phone,
        user.city,
        user.email,
        user.role,
        user.password,
      ],
    );
    return result.rows[0];
  }
}
