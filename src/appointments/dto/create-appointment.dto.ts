import { IsInt, IsDateString, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  doctorId: number;

  @IsDateString()
  startsAt: string;
}
