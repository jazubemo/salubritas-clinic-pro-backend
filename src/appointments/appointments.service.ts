import { FlattenMaps, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { tz } from '@date-fns/tz';
import { startOfDay, endOfDay } from 'date-fns';

import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { Appointment } from './entities/appointment.entity';
import { APP_TIMEZONE } from 'src/common/constants/app.constants';
import { AppointmentFilters } from './interfaces/AppointmentFilters';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  create(createAppointmentInput: CreateAppointmentInput) {
    return 'This action adds a new appointment';
  }

  findAll() {
    return `This action returns all appointments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appointment`;
  }

  update(id: number, updateAppointmentInput: UpdateAppointmentInput) {
    return `This action updates a #${id} appointment`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
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

  async findTodayClinicAppointments(
    clinicId: string,
    filters?: AppointmentFilters,
  ) {
    const startOfHondurasToday = startOfDay(new Date(), {
      in: tz(APP_TIMEZONE),
    });

    const endOfHondurasToday = endOfDay(new Date(), {
      in: tz(APP_TIMEZONE),
    });

    try {
      const query: Record<string, any> = {
        clinicId: new Types.ObjectId(clinicId),
        startTime: {
          $gte: startOfHondurasToday,
          $lte: endOfHondurasToday,
        },
      };
      if (filters?.doctorId) {
        query.doctorId = new Types.ObjectId(filters.doctorId);
      }

      if (filters?.patientId) {
        query.patientId = new Types.ObjectId(filters.patientId);
      }

      console.time('Database Query Time');
      const result = await this.appointmentModel
        .find(query)
        .sort({ startTime: 1 })
        .lean()
        .exec();
      console.timeEnd('Database Query Time');
      console.log('result', result);
      return result;
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
