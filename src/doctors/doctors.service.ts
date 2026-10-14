import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { DoctorProfile } from './doctor.types.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(search?: string): Promise<DoctorProfile[]> {
    const result = await this.database.query<DoctorProfile>(
      `
        SELECT
          d.id,
          d.user_id,
          d.specialization,
          d.experience_type,
          d.experience,
          d.avatar_url,
          d.avatar_public_id,
          d.created_at,
          d.updated_at,
          u.name,
          u.surname,
          u.city
        FROM doctors d
        JOIN users u ON u.id = d.user_id
        WHERE
          $1::text IS NULL
          OR CONCAT(u.name, ' ', u.surname) ILIKE '%' || $1 || '%'
          OR d.specialization ILIKE '%' || $1 || '%'
        ORDER BY d.id DESC
      `,
      [search?.trim() || null],
    );

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
        d.avatar_url,
        d.avatar_public_id,
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

  async uploadAvatar(id: number, buffer: Buffer): Promise<DoctorProfile> {
    const existingDoctor = await this.findById(id);

    if (!existingDoctor) {
      throw new NotFoundException('Doctor not found');
    }

    const uploadedImage = await this.cloudinaryService.uploadImage(
      buffer,
      'doctors',
    );

    let result;

    try {
      result = await this.database.query<DoctorProfile>(
        `
          UPDATE doctors
          SET
            avatar_url = $1,
            avatar_public_id = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `,
        [uploadedImage.secure_url, uploadedImage.public_id, id],
      );
    } catch (error) {
      try {
        await this.cloudinaryService.deleteImage(uploadedImage.public_id);
      } catch {}

      throw error;
    }

    if (existingDoctor.avatar_public_id) {
      try {
        await this.cloudinaryService.deleteImage(
          existingDoctor.avatar_public_id,
        );
      } catch {}
    }

    return {
      ...result.rows[0],
      name: existingDoctor.name,
      surname: existingDoctor.surname,
      city: existingDoctor.city,
    };
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
}
