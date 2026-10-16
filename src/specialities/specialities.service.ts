import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { Speciality } from './speciality.types.js';
import { SPECIALITIES } from './specialities.data.js';

@Injectable()
export class SpecialitiesService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(): Promise<Speciality[]> {
    const result = await this.database.query<{
      title: string;
      doctorsAmount: number;
    }>(`
      SELECT
        specialization AS title,
        COUNT(*)::INTEGER AS "doctorsAmount"
      FROM doctors
      WHERE specialization IS NOT NULL
        AND TRIM(specialization) <> ''
      GROUP BY LOWER(TRIM(specialization)), specialization
    `);
    const doctorsBySpeciality = new Map<string, number>();
    for (const doctor of result.rows) {
      const key = doctor.title.trim().toLowerCase() ?? '';
      const currentAmount = doctorsBySpeciality.get(key) ?? 0;
      doctorsBySpeciality.set(key, currentAmount + doctor.doctorsAmount);
    }
    return SPECIALITIES.map((speciality) => ({
      title: speciality.title,
      doctorsAmount:
        doctorsBySpeciality.get(speciality.title.trim().toLowerCase()) ?? 0,
    })).sort(
      (a, b) =>
        b.doctorsAmount - a.doctorsAmount || a.title.localeCompare(b.title),
    );
  }
}
