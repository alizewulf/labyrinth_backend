import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DoctorSchedule } from './doctor-schedules.types.js';
import { DatabaseService } from '../database/database.service.js';
import { AvailableSlot, OccupiedAppointment } from './available-slot.types.js';
import { DoctorScheduleException } from './doctor-schedule-exception.types.js';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto.js';

@Injectable()
export class DoctorSchedulesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDoctorSchedule(
    doctorId: number,
    dayOfWeek: number,
  ): Promise<DoctorSchedule[]> {
    const result = await this.databaseService.query<DoctorSchedule>(
      `SELECT id, doctor_id, day_of_week, start_time, end_time
       FROM doctor_schedules
       WHERE doctor_id = $1 AND day_of_week = $2
       ORDER BY start_time`,
      [doctorId, dayOfWeek],
    );

    return result.rows;
  }
  async getMySchedule(doctorUserId: number): Promise<DoctorSchedule[]> {
    const result = await this.databaseService.query<DoctorSchedule>(
      `SELECT
         ds.id,
         ds.doctor_id,
         ds.day_of_week,
         ds.start_time,
         ds.end_time
       FROM doctor_schedules ds
       JOIN doctors d ON d.id = ds.doctor_id
       WHERE d.user_id = $1
       ORDER BY ds.day_of_week, ds.start_time`,
      [doctorUserId],
    );

    return result.rows;
  }
  async updateMySchedule(
    doctorUserId: number,
    schedule: UpdateDoctorScheduleDto['schedule'],
  ): Promise<DoctorSchedule[]> {
    const sortedSchedule = [...schedule].sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
    );

    for (let i = 0; i < sortedSchedule.length; i++) {
      const current = sortedSchedule[i];

      if (current.endTime <= current.startTime) {
        throw new BadRequestException('endTime must be later than startTime');
      }

      const previous = sortedSchedule[i - 1];

      if (
        previous &&
        previous.dayOfWeek === current.dayOfWeek &&
        previous.endTime > current.startTime
      ) {
        throw new BadRequestException(
          'Schedule intervals cannot overlap on the same day',
        );
      }
    }

    return this.databaseService.transaction(async (client) => {
      const doctorResult = await client.query<{ id: number }>(
        `SELECT id
         FROM doctors
         WHERE user_id = $1
         FOR UPDATE`,
        [doctorUserId],
      );

      const doctor = doctorResult.rows[0];

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }
      const appointmentsResult = await client.query<{
        id: number;
        day_of_week: number;
        local_start_time: string;
        local_end_time: string;
        exception_is_available: boolean | null;
        exception_start_time: string | null;
        exception_end_time: string | null;
      }>(
        `SELECT
           a.id,
           EXTRACT(
             ISODOW FROM a.starts_at AT TIME ZONE 'Asia/Tbilisi'
           )::int AS day_of_week,
           TO_CHAR(
             a.starts_at AT TIME ZONE 'Asia/Tbilisi',
             'HH24:MI:SS'
           ) AS local_start_time,
           TO_CHAR(
             a.ends_at AT TIME ZONE 'Asia/Tbilisi',
             'HH24:MI:SS'
           ) AS local_end_time,
           e.is_available AS exception_is_available,
           e.start_time AS exception_start_time,
           e.end_time AS exception_end_time
         FROM appointments a
         LEFT JOIN doctor_schedule_exceptions e
           ON e.doctor_id = a.doctor_id
           AND e.date = (
             a.starts_at AT TIME ZONE 'Asia/Tbilisi'
           )::date
         WHERE a.doctor_id = $1
           AND a.status IN ('pending', 'accepted')
           AND a.starts_at > NOW()`,
        [doctor.id],
      );

      const acceptedAppointments = appointmentsResult.rows;

      const toMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      for (const appointment of acceptedAppointments) {
        let validIntervals: { start_time: string; end_time: string }[];

        if (appointment.exception_is_available !== null) {
          if (!appointment.exception_is_available) {
            throw new BadRequestException(
              `Cannot update schedule: appointment ${appointment.id} falls on an unavailable date`,
            );
          }

          validIntervals = [
            {
              start_time: appointment.exception_start_time!,
              end_time: appointment.exception_end_time!,
            },
          ];
        } else {
          validIntervals = sortedSchedule
            .filter((entry) => entry.dayOfWeek === appointment.day_of_week)
            .map((entry) => ({
              start_time: entry.startTime,
              end_time: entry.endTime,
            }));
        }

        const appointmentStart = toMinutes(appointment.local_start_time);
        const appointmentEnd = toMinutes(appointment.local_end_time);

        const fitsSchedule = validIntervals.some(
          (interval) =>
            appointmentStart >= toMinutes(interval.start_time) &&
            appointmentEnd <= toMinutes(interval.end_time),
        );

        if (!fitsSchedule) {
          throw new BadRequestException(
            `Cannot update schedule: appointment ${appointment.id} falls outside the new working hours`,
          );
        }
      }
      await client.query(
        `DELETE FROM doctor_schedules
         WHERE doctor_id = $1`,
        [doctor.id],
      );

      for (const entry of sortedSchedule) {
        await client.query(
          `INSERT INTO doctor_schedules (
             doctor_id,
             day_of_week,
             start_time,
             end_time
           )
           VALUES ($1, $2, $3, $4)`,
          [doctor.id, entry.dayOfWeek, entry.startTime, entry.endTime],
        );
      }

      const result = await client.query<DoctorSchedule>(
        `SELECT id, doctor_id, day_of_week, start_time, end_time
         FROM doctor_schedules
         WHERE doctor_id = $1
         ORDER BY day_of_week, start_time`,
        [doctor.id],
      );

      return result.rows;
    });
  }
  async getAvailableSlots(
    doctorId: number,
    date: string,
  ): Promise<AvailableSlot[]> {
    const selectedDate = new Date(`${date}T00:00:00Z`);
    const dayOfWeek = selectedDate.getUTCDay() || 7;

    const exceptionResult =
      await this.databaseService.query<DoctorScheduleException>(
        `SELECT id, doctor_id, date, is_available, start_time, end_time
         FROM doctor_schedule_exceptions
         WHERE doctor_id = $1 AND date = $2::date`,
        [doctorId, date],
      );

    const exception = exceptionResult.rows[0];

    if (exception && !exception.is_available) {
      return [];
    }

    let schedules: { start_time: string; end_time: string }[];

    if (exception?.is_available) {
      schedules = [
        {
          start_time: exception.start_time!,
          end_time: exception.end_time!,
        },
      ];
    } else {
      const scheduleResult = await this.databaseService.query<DoctorSchedule>(
        `SELECT id, doctor_id, day_of_week, start_time, end_time
           FROM doctor_schedules
           WHERE doctor_id = $1 AND day_of_week = $2
           ORDER BY start_time`,
        [doctorId, dayOfWeek],
      );

      schedules = scheduleResult.rows;
    }

    const appointmentsResult =
      await this.databaseService.query<OccupiedAppointment>(
        `SELECT
           TO_CHAR(
             starts_at AT TIME ZONE 'Asia/Tbilisi',
             'HH24:MI:SS'
           ) AS local_start_time,
           TO_CHAR(
             ends_at AT TIME ZONE 'Asia/Tbilisi',
             'HH24:MI:SS'
           ) AS local_end_time
         FROM appointments
         WHERE doctor_id = $1
           AND starts_at <
             (($2::date + INTERVAL '1 day') AT TIME ZONE 'Asia/Tbilisi')
           AND ends_at >
             ($2::date::timestamp AT TIME ZONE 'Asia/Tbilisi')
           AND status = 'accepted'`,
        [doctorId, date],
      );

    const occupiedAppointments = appointmentsResult.rows;
    const slots: AvailableSlot[] = [];

    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return `${String(hours).padStart(2, '0')}:${String(
        remainingMinutes,
      ).padStart(2, '0')}:00`;
    };

    for (const schedule of schedules) {
      const [startHours, startMinutes] = schedule.start_time
        .split(':')
        .map(Number);

      const [endHours, endMinutes] = schedule.end_time.split(':').map(Number);

      const scheduleStart = startHours * 60 + startMinutes;
      const scheduleEnd = endHours * 60 + endMinutes;

      for (let start = scheduleStart; start + 30 <= scheduleEnd; start += 30) {
        const end = start + 30;
        const isOccupied = occupiedAppointments.some((appointment) => {
          const [occupiedStartHours, occupiedStartMinutes] =
            appointment.local_start_time.split(':').map(Number);

          const [occupiedEndHours, occupiedEndMinutes] =
            appointment.local_end_time.split(':').map(Number);

          const occupiedStart = occupiedStartHours * 60 + occupiedStartMinutes;
          const occupiedEnd = occupiedEndHours * 60 + occupiedEndMinutes;

          return start < occupiedEnd && end > occupiedStart;
        });

        if (!isOccupied) {
          slots.push({
            startTime: formatTime(start),
            endTime: formatTime(end),
          });
        }
      }
    }

    return slots;
  }
}
