import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  specialization?: string;

  @IsOptional()
  @IsIn(['month', 'year'])
  experience_type?: 'month' | 'year';

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;
}
