import type { City } from "../shared/types/city.types.js";

export type UserRole = "admin" | "user" | "doctor";

export interface User {
  id: number;
  name: string;
  surname: string;
  birthdate: string;
  phone: string;
  city: City;
  email: string;
  role: UserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistration {
  name: string;
  surname: string;
  birthdate: string;
  phone: string;
  city: City;
  email: string;
  role: UserRole;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}