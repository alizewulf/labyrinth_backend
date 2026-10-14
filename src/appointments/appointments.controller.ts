import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/jwt/jwt-payload.type.js';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { Param, Patch, ParseIntPipe } from '@nestjs/common';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() request: { user: JwtPayload }) {
    return this.appointmentsService.findForUser(
      request.user.sub,
      request.user.role,
    );
  }
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  getMetrics(@Req() request: { user: JwtPayload }) {
    if (request.user.role !== 'user') {
      throw new ForbiddenException('Only patients can access patient metrics');
    }

    return this.appointmentsService.getPatientMetrics(request.user.sub);
  }
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Req() request: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    if (request.user.role !== 'doctor') {
      throw new ForbiddenException(
        'Only doctors can update appointment status',
      );
    }

    return this.appointmentsService.updateStatus(
      request.user.sub,
      id,
      dto.status,
    );
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() request: { user: JwtPayload },
    @Body() dto: CreateAppointmentDto,
  ) {
    if (request.user.role !== 'user') {
      throw new ForbiddenException('Only patients can create appointments');
    }

    return this.appointmentsService.create(request.user.sub, dto);
  }
}
