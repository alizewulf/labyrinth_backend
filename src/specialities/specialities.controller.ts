import { Controller, Get } from '@nestjs/common';
import { SpecialitiesService } from './specialities.service.js';

@Controller('specialities')
export class SpecialitiesController {
  constructor(private readonly specialitiesService: SpecialitiesService) {}

  @Get()
  findAll() {
    return this.specialitiesService.findAll();
  }
}
