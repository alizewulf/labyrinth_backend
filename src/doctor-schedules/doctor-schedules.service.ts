import { Injectable } from '@nestjs/common';
import { DoctorSchedule } from './doctor-schedules.types.js';
import { DatabaseService } from '../database/database.service.js';
import { AvailableSlot, OccupiedAppointment } from './available-slot.types.js';
import { DoctorScheduleException } from './doctor-schedule-exception.types.js';

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
