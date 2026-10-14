import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { AdminGuard } from '../auth/jwt/jwt-admin.guard.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('doctors')
  createDoctor(@Body() dto: CreateDoctorDto) {
    return this.adminService.createDoctor(dto);
  }

  @Get('doctors')
  getDoctors() {
    return this.adminService.getDoctors();
  }

  @Delete('doctors/:id')
  deleteDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDoctor(id);
  }
}
