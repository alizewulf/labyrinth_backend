import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { DoctorsModule } from './doctors/doctors.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';

@Module({
  
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    UsersModule,
    AuthModule, 
    DatabaseModule, DoctorsModule, CloudinaryModule
  ],


  controllers: [],
  providers: [],
})
export class AppModule {}
