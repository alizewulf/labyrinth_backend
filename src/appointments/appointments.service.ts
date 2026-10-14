import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { Appointment } from './appointments.types.js';
import { AppointmentMetrics } from './appointment-metrics.types.js';

const CLINIC_TIMEZONE = 'Asia/Tbilisi';

interface LocalAppointmentTime {
  local_date: string;
  day_of_week: number;
  local_start_time: string;
  local_end_time: string;
}

interface ScheduleInterval {
  start_time: string;
  end_time: string;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly databaseService: DatabaseService) {}
  async findForUser(userId: number, role: string): Promise<Appointment[]> {
    let query: string;
    let params: number[];

    if (role === 'user') {
      query = `
        SELECT *
        FROM appointments
        WHERE patient_id = $1
        ORDER BY starts_at DESC
      `;
      params = [userId];
    } else if (role === 'doctor') {
      query = `
        SELECT a.*
        FROM appointments AS a
        JOIN doctors AS d ON d.id = a.doctor_id
        WHERE d.user_id = $1
        ORDER BY a.starts_at DESC
      `;
      params = [userId];
    } else if (role === 'admin') {
      query = `
        SELECT *
        FROM appointments
        ORDER BY starts_at DESC
      `;
      params = [];
    } else {
      throw new ForbiddenException('Invalid user role');
    }

    const result = await this.databaseService.query<Appointment>(query, params);

    return result.rows;
  }
  async create(
    patientId: number,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dto.startsAt)) {
      throw new BadRequestException(
        'startsAt must include a timezone, for example +04:00 or Z',
      );
    }

    const startsAt = new Date(dto.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid appointment date');
    }

    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    return this.databaseService.transaction(async (client) => {
      const doctorResult = await client.query(
        'SELECT id FROM doctors WHERE id = $1 FOR UPDATE',
        [dto.doctorId],
      );

      if (doctorResult.rowCount === 0) {
        throw new NotFoundException('Doctor not found');
      }

      const localTimeResult = await client.query<LocalAppointmentTime>(
        `SELECT
           ($1::timestamptz AT TIME ZONE $3)::date::text AS local_date,
           EXTRACT(
             ISODOW FROM ($1::timestamptz AT TIME ZONE $3)
           )::int AS day_of_week,
           ($1::timestamptz AT TIME ZONE $3)::time::text
             AS local_start_time,
           ($2::timestamptz AT TIME ZONE $3)::time::text
             AS local_end_time`,
        [startsAt.toISOString(), endsAt.toISOString(), CLINIC_TIMEZONE],
      );

      const localTime = localTimeResult.rows[0];

      if (!localTime) {
        throw new BadRequestException('Could not determine appointment time');
      }

      const [hours, minutes] = localTime.local_start_time
        .split(':')
        .map(Number);

      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes % 30 !== 0) {
        throw new BadRequestException(
          'Appointments must start on a 30-minute boundary',
        );
      }

      const exceptionResult = await client.query<{
        is_available: boolean;
        start_time: string | null;
        end_time: string | null;
      }>(
        `SELECT is_available, start_time, end_time
         FROM doctor_schedule_exceptions
         WHERE doctor_id = $1 AND date = $2::date`,
        [dto.doctorId, localTime.local_date],
      );

      const exception = exceptionResult.rows[0];

      if (exception && !exception.is_available) {
        throw new BadRequestException('Doctor is unavailable on this date');
      }

      let schedules: ScheduleInterval[];

      if (exception?.is_available) {
        schedules = [
          {
            start_time: exception.start_time!,
            end_time: exception.end_time!,
          },
        ];
      } else {
        const scheduleResult = await client.query<ScheduleInterval>(
          `SELECT start_time, end_time
           FROM doctor_schedules
           WHERE doctor_id = $1 AND day_of_week = $2`,
          [dto.doctorId, localTime.day_of_week],
        );

        schedules = scheduleResult.rows;
      }

      const fitsSchedule = schedules.some(
        (schedule) =>
          localTime.local_start_time >= schedule.start_time &&
          localTime.local_end_time <= schedule.end_time,
      );

      if (!fitsSchedule) {
        throw new BadRequestException(
          'Appointment is outside the doctor schedule',
        );
      }

      const conflictResult = await client.query(
        `SELECT id
         FROM appointments
         WHERE doctor_id = $1
           AND status = 'accepted'
           AND starts_at < $3::timestamptz
           AND ends_at > $2::timestamptz
         LIMIT 1`,
        [dto.doctorId, startsAt.toISOString(), endsAt.toISOString()],
      );

      if (conflictResult.rowCount && conflictResult.rowCount > 0) {
        throw new BadRequestException('This time slot is already booked');
      }

      const appointmentResult = await client.query<Appointment>(
        `INSERT INTO appointments (
           patient_id,
           doctor_id,
           starts_at,
           ends_at,
           status
         )
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [patientId, dto.doctorId, startsAt.toISOString(), endsAt.toISOString()],
      );

      return appointmentResult.rows[0];
    });
  }
  async getPatientMetrics(patientId: number): Promise<AppointmentMetrics> {
    const result = await this.databaseService.query<AppointmentMetrics>(
      `SELECT
         COUNT(*) FILTER (
           WHERE status = 'accepted'
             AND starts_at > NOW()
         )::int AS upcoming,
         COUNT(*) FILTER (
           WHERE status = 'pending'
         )::int AS pending,
         COUNT(*) FILTER (
           WHERE status = 'completed'
         )::int AS completed
       FROM appointments
       WHERE patient_id = $1`,
      [patientId],
    );

    return result.rows[0];
  }
  async getDoctorMetrics(doctorUserId: number): Promise<AppointmentMetrics> {
    const result = await this.databaseService.query<AppointmentMetrics>(
      `SELECT
         COUNT(*) FILTER (
           WHERE a.status = 'accepted'
             AND a.starts_at > NOW()
         )::int AS upcoming,
         COUNT(*) FILTER (
           WHERE a.status = 'pending'
         )::int AS pending,
         COUNT(*) FILTER (
           WHERE a.status = 'completed'
         )::int AS completed
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE d.user_id = $1`,
      [doctorUserId],
    );

    return result.rows[0];
  }
  async updateStatus(
    doctorUserId: number,
    appointmentId: number,
    status: 'accepted' | 'rejected',
  ): Promise<Appointment> {
    return this.databaseService.transaction(async (client) => {
      const appointmentResult = await client.query<Appointment>(
        `SELECT *
         FROM appointments
         WHERE id = $1`,
        [appointmentId],
      );

      const appointment = appointmentResult.rows[0];

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const doctorResult = await client.query<{ id: number }>(
        `SELECT id
         FROM doctors
         WHERE id = $1
         FOR UPDATE`,
        [appointment.doctor_id],
      );

      const doctor = doctorResult.rows[0];

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const ownerResult = await client.query(
        `SELECT id
         FROM doctors
         WHERE id = $1 AND user_id = $2`,
        [appointment.doctor_id, doctorUserId],
      );

      if (ownerResult.rowCount === 0) {
        throw new ForbiddenException(
          'You cannot manage another doctor’s appointments',
        );
      }

      const currentResult = await client.query<Appointment>(
        `SELECT *
         FROM appointments
         WHERE id = $1
         FOR UPDATE`,
        [appointmentId],
      );

      const currentAppointment = currentResult.rows[0];

      if (!currentAppointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (currentAppointment.status !== 'pending') {
        throw new BadRequestException(
          'Only pending appointments can be updated',
        );
      }

      if (status === 'accepted') {
        const scheduleCheckResult = await client.query<{
          has_exception: boolean;
          exception_is_available: boolean | null;
          fits_exception: boolean | null;
          fits_weekly_schedule: boolean;
        }>(
          `SELECT
           e.id IS NOT NULL AS has_exception,
           e.is_available AS exception_is_available,

           (
             e.is_available = TRUE
             AND e.start_time <= (a.starts_at AT TIME ZONE 'Asia/Tbilisi')::time
             AND e.end_time >= (a.ends_at AT TIME ZONE 'Asia/Tbilisi')::time
           ) AS fits_exception,

           EXISTS (
             SELECT 1
             FROM doctor_schedules ds
             WHERE ds.doctor_id = a.doctor_id
               AND ds.day_of_week =
                 EXTRACT(ISODOW FROM a.starts_at AT TIME ZONE 'Asia/Tbilisi')::int
               AND ds.start_time <=
                 (a.starts_at AT TIME ZONE 'Asia/Tbilisi')::time
               AND ds.end_time >=
                 (a.ends_at AT TIME ZONE 'Asia/Tbilisi')::time
           ) AS fits_weekly_schedule

         FROM appointments a
         LEFT JOIN doctor_schedule_exceptions e
           ON e.doctor_id = a.doctor_id
           AND e.date = (a.starts_at AT TIME ZONE 'Asia/Tbilisi')::date
         WHERE a.id = $1`,
          [appointmentId],
        );

        const scheduleCheck = scheduleCheckResult.rows[0];

        if (scheduleCheck.has_exception) {
          if (
            !scheduleCheck.exception_is_available ||
            !scheduleCheck.fits_exception
          ) {
            throw new BadRequestException(
              'Appointment does not fit the doctor’s schedule',
            );
          }
        } else if (!scheduleCheck.fits_weekly_schedule) {
          throw new BadRequestException(
            'Appointment does not fit the doctor’s schedule',
          );
        }
        const conflictResult = await client.query(
          `SELECT id
           FROM appointments
           WHERE doctor_id = $1
             AND id <> $2
             AND status = 'accepted'
             AND starts_at < $4
             AND ends_at > $3
           LIMIT 1`,
          [
            currentAppointment.doctor_id,
            appointmentId,
            currentAppointment.starts_at,
            currentAppointment.ends_at,
          ],
        );

        if (conflictResult.rowCount && conflictResult.rowCount > 0) {
          throw new BadRequestException('This time slot is already booked');
        }
      }

      const updatedResult = await client.query<Appointment>(
        `UPDATE appointments
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, appointmentId],
      );

      return updatedResult.rows[0];
    });
  }
}
