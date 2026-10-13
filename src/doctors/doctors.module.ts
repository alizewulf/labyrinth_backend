import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller.js';
import { DoctorsService } from './doctors.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}
