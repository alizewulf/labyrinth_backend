import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { DoctorProfile } from './doctor.types.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import * as bcrypt from 'bcrypt';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@Injectable()
export class DoctorsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(): Promise<DoctorProfile[]> {
    const result = await this.database.query<DoctorProfile>(`
      SELECT
        d.id,
        d.user_id,
        d.specialization,
        d.experience_type,
        d.experience,
        d.created_at,
        d.updated_at,
        u.name,
        u.surname,
        u.city
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      ORDER BY d.id DESC
    `);
    return result.rows;
  }

  async findById(id: number): Promise<DoctorProfile | null> {
    const result = await this.database.query<DoctorProfile>(
      `
        SELECT
        d.id,
        d.user_id,
        d.specialization,
        d.experience_type,
        d.experience,
        d.created_at,
        d.updated_at,
        u.name,
        u.surname,
        u.city
        FROM doctors d
        JOIN users u ON u.id = d.user_id
        WHERE d.id = $1
      `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async update(id: number, dto: UpdateDoctorDto): Promise<DoctorProfile> {
    const existingDoctor = await this.findById(id);

    if (!existingDoctor) {
      throw new NotFoundException('Doctor not found');
    }

    const result = await this.database.query<DoctorProfile>(
      `
      UPDATE doctors
      SET
        specialization = COALESCE($1, specialization),
        experience_type = COALESCE($2, experience_type),
        experience = COALESCE($3, experience),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [
        dto.specialization ?? null,
        dto.experience_type ?? null,
        dto.experience ?? null,
        id,
      ],
    );
    return {
      ...result.rows[0],
      name: existingDoctor.name,
      surname: existingDoctor.surname,
      city: existingDoctor.city,
    };
  }

  async create(dto: CreateDoctorDto): Promise<{ id: number }> {
    try {
      return await this.database.transaction(async (client) => {
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const userResult = await client.query<{ id: number }>(
          `INSERT INTO users (
            name,
            surname,
            phone,
            email,
            role,
            password_hash
          )
          VALUES ($1, $2, $3, $4, 'doctor', $5)
          RETURNING id`,
          [dto.name, dto.surname, dto.phone, dto.email, passwordHash],
        );

        const userId = userResult.rows[0].id;

        await client.query(
          `INSERT INTO doctors (
            user_id,
            specialization,
            experience_type,
            experience
          )
          VALUES ($1, $2, $3, $4)`,
          [userId, dto.specialization, dto.experience_type, dto.experience],
        );

        return { id: userId };
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
}
