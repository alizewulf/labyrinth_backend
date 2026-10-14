import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
  UseGuards,
  ForbiddenException,
  Req,
  Put,
  Body,
} from '@nestjs/common';
import { DoctorSchedulesService } from './doctor-schedules.service.js';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { JwtPayload } from '../auth/jwt/jwt-payload.type.js';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto.js';

@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySchedule(@Req() request: { user: JwtPayload }) {
    if (request.user.role !== 'doctor') {
      throw new ForbiddenException('Only doctors can access their schedule');
    }

    return this.doctorSchedulesService.getMySchedule(request.user.sub);
  }
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

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMySchedule(
    @Req() request: { user: JwtPayload },
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    if (request.user.role !== 'doctor') {
      throw new ForbiddenException('Only doctors can update their schedule');
    }

    return this.doctorSchedulesService.updateMySchedule(
      request.user.sub,
      dto.schedule,
    );
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
