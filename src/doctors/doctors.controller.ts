import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { AdminGuard } from '../auth/jwt/jwt-admin.guard.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';

@Controller('doctors')
export class DoctorsController {
    constructor (private readonly doctorsService: DoctorsService) {}

    @Get()
    findAll() {
        return this.doctorsService.findAll()
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() dto:CreateDoctorDto, @Req() request:Request) {
        return this.doctorsService.create(dto)
    }
}
