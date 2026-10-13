import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { Speciality } from './speciality.types.js';

@Injectable()
export class SpecialitiesService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(): Promise<Speciality[]> {
    const result = await this.database.query<Speciality>(`
      SELECT
        specialization AS title,
        COUNT(*)::INTEGER AS "doctorsAmount"
      FROM doctors
      GROUP BY specialization
      ORDER BY specialization ASC
    `);

    return result.rows;
  }
}
