import { ClientSession, Connection, FlattenMaps, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { AppointmentFiltersArgs } from './dto/get-appointments-filter.args';
import { DateTime } from 'luxon';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/role.enum';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly usersService: UsersService,
  ) {}

  async getOverlappingAppointment(
    appointment: Partial<Appointment>,
    excludeAppointmentId?: string,
    session?: ClientSession,
  ): Promise<Appointment[]> {
    try {
      const { doctorId, patientId, startTime, endTime, clinicId } = appointment;
      const query: Record<string, any> = {
        clinicId,
        status: {
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        $or: [{ doctorId: doctorId }, { patientId: patientId }],
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      };

      // Exclude the appointment itself from the overlap check
      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }

      return await this.find(query, session);
    } catch (error) {
      this.logger.error(
        `Failed to check overlap for doctor ${appointment.doctorId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Database check failed.');
    }
  }

  async create(createAppointmentInput: CreateAppointmentInput) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const newAppointment = {
        ...createAppointmentInput,
        clinicId: new Types.ObjectId(createAppointmentInput.clinicId),
        doctorId: new Types.ObjectId(createAppointmentInput.doctorId),
        patientId: new Types.ObjectId(createAppointmentInput.patientId),
        startTime: new Date(createAppointmentInput.startTime),
        endTime: new Date(createAppointmentInput.endTime),
        doctorName: 'Unknown',
        patientName: 'Unknown',
      };

      const doctor = await this.usersService.findActiveClinicMember(
        newAppointment.doctorId,
        newAppointment.clinicId.toString(),
        Role.DOCTOR,
        session,
      );

      const patient = await this.usersService.findActiveClinicMember(
        newAppointment.patientId,
        newAppointment.clinicId.toString(),
        Role.PATIENT,
        session,
      );

      // updating respective values
      newAppointment.doctorName = doctor.lastName;
      newAppointment.patientName = `${patient.firstName} ${patient.lastName}`;

      const overlappingAppointment = await this.getOverlappingAppointment({
        clinicId: newAppointment.clinicId,
        patientId: newAppointment.patientId,
        doctorId: newAppointment.doctorId,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
      });

      if (overlappingAppointment.length > 0) {
        const isDoctorBusy =
          overlappingAppointment[0].doctorId.toString() ===
          createAppointmentInput.doctorId.toString();
        const entity = isDoctorBusy ? 'The doctor' : 'The patient';

        throw new ConflictException(
          `${entity} is already scheduled for an appointment during this timeframe.`,
        );
      }

      const [newlyCreatedAppointment] = await this.appointmentModel.create(
        [newAppointment],
        { session },
      );

      await session.commitTransaction();
      return newlyCreatedAppointment;
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof HttpException) {
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
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, updateAppointmentInput: UpdateAppointmentInput) {
    const objectId = new Types.ObjectId(id);

    const existingAppointment = await this.find({ _id: id });

    if (existingAppointment.length === 0) {
      throw new NotFoundException('User profile not found in database.');
    }

    if (updateAppointmentInput.startTime || updateAppointmentInput.endTime) {
      const isOverlappingAppointment = await this.getOverlappingAppointment({
        clinicId: existingAppointment[0].clinicId,
        doctorId: existingAppointment[0].doctorId,
        startTime: updateAppointmentInput.startTime
          ? updateAppointmentInput.startTime
          : existingAppointment[0].startTime,
        endTime: updateAppointmentInput.endTime
          ? updateAppointmentInput.endTime
          : existingAppointment[0].endTime,
      });

      if (isOverlappingAppointment) {
        throw new BadRequestException(
          'The doctor is already booked or has an overlapping appointment during this time range.',
        );
      }
    }

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
    session?: ClientSession,
  ): Promise<FlattenMaps<Appointment[]>> {
    try {
      const query = this.appointmentModel
        .find(filters)
        .sort({ startTime: 1 })
        .lean();

      if (session) {
        query.session(session);
      }

      return await query.exec();
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

  async findAppointments(clinicId: string, filters: AppointmentFiltersArgs) {
    try {
      const { startRangeString, endRangeString, timezone } = filters;

      const localStart = DateTime.fromISO(startRangeString, { zone: timezone });
      const localEnd = DateTime.fromISO(endRangeString, { zone: timezone });

      const startRangeUtc = localStart.toJSDate();
      const endRangeUtc = localEnd.toJSDate();

      const query: Record<string, any> = {
        clinicId: new Types.ObjectId(clinicId),
        startTime: {
          $gte: startRangeUtc,
          $lte: endRangeUtc,
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
