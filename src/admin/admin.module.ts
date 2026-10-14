import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService],
})
export class AdminModule {}
