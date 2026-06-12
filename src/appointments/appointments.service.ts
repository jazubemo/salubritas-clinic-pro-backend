import { FlattenMaps, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { AppointmentFilters } from './interfaces/AppointmentFilters';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Appointment } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  async create(createAppointmentInput: CreateAppointmentInput) {
    try {
      const newAppointment = {
        ...createAppointmentInput,
        clinicId: new Types.ObjectId(createAppointmentInput.clinicId),
        doctorId: new Types.ObjectId(createAppointmentInput.doctorId),
        patientId: new Types.ObjectId(createAppointmentInput.patientId),
        startTime: new Date(createAppointmentInput.startTime),
        endTime: new Date(createAppointmentInput.endTime),
      };

      const overlappingAppointment = await this.find({
        clinicId: newAppointment.clinicId,
        doctorId: newAppointment.doctorId,
        status: {
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        // Overlap formula: (StartA < EndB) AND (EndA > StartB)
        startTime: { $lt: newAppointment.endTime },
        endTime: { $gt: newAppointment.startTime },
      });

      if (overlappingAppointment.length > 0) {
        throw new BadRequestException(
          'The doctor is already booked or has an overlapping appointment during this time range.',
        );
      }

      return await this.appointmentModel.create(newAppointment);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to create this appointment in the database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating this appointment.',
      );
    }
  }

  async update(id: string, updateAppointmentInput: UpdateAppointmentInput) {
    const objectId = new Types.ObjectId(id);

    try {
      const updatedDocument = await this.appointmentModel
        .findByIdAndUpdate(
          objectId,
          { $set: updateAppointmentInput },
          {
            new: true,
          },
        )
        .lean()
        .exec();

      if (!updatedDocument) {
        throw new BadRequestException(
          `No appointment found with the provided ID: ${id}`,
        );
      }

      return updatedDocument;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to update appointment with id ${id}`,
        errorMessage,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating the appointment.',
      );
    }
  }

  private async find(
    filters: Record<string, any>,
  ): Promise<FlattenMaps<Appointment[]>> {
    try {
      const appointments = await this.appointmentModel
        .find(filters)
        .sort({ startTime: 1 })
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
        'An unexpected error occurred while retrieving appointments.',
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

      return await this.find(query);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to fetch these clinic appointments from database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching clinic appointments data.',
      );
    }
  }
}
