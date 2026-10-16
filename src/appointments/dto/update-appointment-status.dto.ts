import { IsIn } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['accepted', 'rejected'])
  status!: 'accepted' | 'rejected';
}
