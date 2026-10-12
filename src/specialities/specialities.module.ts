import { Module } from '@nestjs/common';
import { SpecialitiesController } from './specialities.controller.js';
import { SpecialitiesService } from './specialities.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SpecialitiesController],
  providers: [SpecialitiesService],
})
export class SpecialitiesModule {}
