import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard.js';
import { AdminGuard } from '../auth/jwt/jwt-admin.guard.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedRequest, DoctorProfile } from './doctor.types.js';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyProfile(@Req() request: AuthenticatedRequest) {
    return this.doctorsService.findMyProfile(request.user.sub);
  }

  @Get()
  findAll(@Query('search') search?: string): Promise<DoctorProfile[]> {
    return this.doctorsService.findAll(search);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const doctor = await this.doctorsService.findById(id);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  uploadMyAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.doctorsService.uploadMyAvatar(request.user.sub, file.buffer);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.doctorsService.uploadAvatar(id, file.buffer);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMySpeciality(
    @Req() request: AuthenticatedRequest,
    @Body('specialization') specialization: string,
  ) {
    return this.doctorsService.updateMySpeciality(
      request.user.sub,
      specialization,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }
}
