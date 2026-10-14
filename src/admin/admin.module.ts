import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
