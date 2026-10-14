import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async createDoctor(
    dto: CreateDoctorDto,
  ): Promise<{ userId: number; doctorId: number }> {
    try {
      return await this.database.transaction(async (client) => {
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const userResult = await client.query<{ id: number }>(
          `
            INSERT INTO users (email, role, password_hash)
            VALUES ($1, 'doctor', $2)
            RETURNING id
          `,
          [dto.email, passwordHash],
        );

        const userId = userResult.rows[0].id;

        const doctorResult = await client.query<{ id: number }>(
          `
            INSERT INTO doctors (user_id)
            VALUES ($1)
            RETURNING id
          `,
          [userId],
        );

        return {
          userId,
          doctorId: doctorResult.rows[0].id,
        };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async getDoctors() {
    const result = await this.database.query(
      `
        SELECT
          d.id AS doctor_id,
          u.id AS user_id,
          u.email,
          u.name,
          u.surname,
          u.city,
          d.specialization,
          d.experience_type,
          d.experience,
          d.created_at,
          (
            u.name IS NOT NULL
            AND u.surname IS NOT NULL
            AND u.city IS NOT NULL
            AND d.specialization IS NOT NULL
            AND d.experience_type IS NOT NULL
            AND d.experience IS NOT NULL
          ) AS profile_completed
        FROM doctors d
        JOIN users u ON u.id = d.user_id
        ORDER BY d.created_at DESC
      `,
    );

    return result.rows;
  }

  async deleteDoctor(doctorId: number): Promise<{ message: string }> {
    const result = await this.database.query(
      `
        DELETE FROM users
        WHERE id = (
          SELECT user_id
          FROM doctors
          WHERE id = $1
        )
        RETURNING id
      `,
      [doctorId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Doctor not found');
    }

    return { message: 'Doctor account deleted successfully' };
  }
}
