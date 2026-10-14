import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DoctorSchedulesService } from './doctor-schedules.service.js';

@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Get(':doctorId')
  async getDoctorSchedule(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('dayOfWeek') dayOfWeek: string,
  ) {
    const day = Number(dayOfWeek);

    if (!Number.isInteger(day) || day < 1 || day > 7) {
      throw new BadRequestException(
        'dayOfWeek must be an integer between 1 and 7',
      );
    }

    return this.doctorSchedulesService.getDoctorSchedule(doctorId, day);
  }

  @Get(':doctorId/available')
  async getAvailableSlots(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    return this.doctorSchedulesService.getAvailableSlots(doctorId, date);
  }
}
