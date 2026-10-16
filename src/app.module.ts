import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { DoctorsModule } from './doctors/doctors.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { SpecialitiesModule } from './specialities/specialities.module.js';
import { DoctorSchedulesModule } from './doctor-schedules/doctor-schedules.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    DatabaseModule,
    DoctorsModule,
    CloudinaryModule,
    SpecialitiesModule,
    DoctorSchedulesModule,
    AppointmentsModule,
    AdminModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
