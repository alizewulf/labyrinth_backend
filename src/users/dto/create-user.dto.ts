import { IsEmail, IsIn, IsString, MinLength } from "class-validator";

import type { City } from "../../shared/types/city.types.js";

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsString()
  birthdate: string;

  @IsString()
  phone: string;

  @IsIn([
    "Tbilisi",
    "Batumi",
    "Kutaisi",
    "Rustavi",
    "Zugdidi",
    "Gori",
    "Poti",
    "Telavi",
    "Senaki",
    "Khashuri",
  ])
  city: City;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}