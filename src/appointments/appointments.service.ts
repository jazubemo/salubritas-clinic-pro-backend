import { FlattenMaps, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { Appointment } from './entities/appointment.entity';
import { AppointmentFilters } from './interfaces/AppointmentFilters';
import { AppointmentStatus } from './enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  create(createAppointmentInput: CreateAppointmentInput) {
    return 'This action adds a new appointment';
  }

  update(id: number, updateAppointmentInput: UpdateAppointmentInput) {
    return `This action updates a #${id} appointment`;
  }

  async find(filter: Record<string, any>): Promise<FlattenMaps<Appointment[]>> {
    try {
      const appointments = await this.appointmentModel
        .find(filter)
        .lean()
        .exec();

      return appointments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to fetch these appointments from database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving this user.',
      );
    }
  }

  async findAppointments(clinicId: string, filters: AppointmentFilters) {
    try {
      const query: Record<string, any> = {
        clinicId: new Types.ObjectId(clinicId),
        startTime: {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        },
        status: {
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      };
      if (filters?.doctorId) {
        query.doctorId = new Types.ObjectId(filters?.doctorId);
      }

      if (filters?.patientId) {
        query.patientId = new Types.ObjectId(filters?.patientId);
      }

      return await this.appointmentModel
        .find(query)
        .sort({ startTime: 1 })
        .lean()
        .exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to fetch this clinic appointments from database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching clinic appointments data.',
      );
    }
  }
}
