import {
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  specialization: string;

  @IsIn(['month', 'year'])
  experience_type: 'month' | 'year';

  @IsInt()
  @Min(0)
  experience: number;
}
