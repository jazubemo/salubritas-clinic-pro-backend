import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsResolver } from './appointments.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment } from './entities/appointment.entity';
import { AppointmentSchema } from './schemas/appointment.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    UsersModule,
  ],
  providers: [AppointmentsResolver, AppointmentsService],
})
export class AppointmentsModule {}
