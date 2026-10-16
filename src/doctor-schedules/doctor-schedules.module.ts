import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DoctorSchedulesController } from './doctor-schedules.controller.js';
import { DoctorSchedulesService } from './doctor-schedules.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DoctorSchedulesController],
  providers: [DoctorSchedulesService],
  exports: [DoctorSchedulesService],
})
export class DoctorSchedulesModule {}
