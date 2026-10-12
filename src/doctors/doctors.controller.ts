import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { AdminGuard } from '../auth/jwt/jwt-admin.guard.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const doctor = await this.doctorsService.findById(id);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateDoctorDto, @Req() request: Request) {
    return this.doctorsService.create(dto);
  }
}
