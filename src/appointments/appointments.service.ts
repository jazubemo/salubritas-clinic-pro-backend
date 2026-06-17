import { ClientSession, Connection, Model, Types } from 'mongoose';
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
import _ from 'lodash';

export type AppointmentChangesWithDoctorData = UpdateAppointmentInput & {
  doctorName?: string;
};

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
    excludeAppointmentId?: string | Types.ObjectId,
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

      const doctor = await this.usersService.fetchAuthorizedUser(
        newAppointment.doctorId,
        newAppointment.clinicId.toString(),
        Role.DOCTOR,
        session,
      );

      const patient = await this.usersService.fetchAuthorizedUser(
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

  private areThereAnyChanges(
    incomingChanges: UpdateAppointmentInput,
    appointment: Appointment,
  ) {
    const existingChanges = _.pick(appointment, Object.keys(incomingChanges));

    return !_.isEqual(incomingChanges, existingChanges);
  }

  private async updateMetadata(
    objectId: Types.ObjectId,
    updateAppointmentInput: UpdateAppointmentInput,
  ): Promise<Appointment> {
    return await this.update(objectId, updateAppointmentInput);
  }

  private async routeAppointmentRequest(
    objectId: Types.ObjectId,
    updateAppointmentInput: UpdateAppointmentInput,
    existingAppointment: Appointment,
  ): Promise<Appointment> {
    if (
      updateAppointmentInput.status ||
      updateAppointmentInput.isNewPatient ||
      updateAppointmentInput.reason
    ) {
      return await this.updateMetadata(objectId, updateAppointmentInput);
    }

    return this.reschedule(
      objectId,
      updateAppointmentInput,
      existingAppointment,
    );
  }

  private async reschedule(
    objectId: Types.ObjectId,
    incomingAppointmentChanges: UpdateAppointmentInput,
    existingAppointment: Appointment,
  ) {
    const {
      startTime,
      endTime,
      doctorId: incomingDoctorId,
    } = incomingAppointmentChanges;

    const internalIncomingChanges: AppointmentChangesWithDoctorData = {
      ...incomingAppointmentChanges,
    };

    const { clinicId, doctorId } = existingAppointment;

    const existingDoctorObjectId = new Types.ObjectId(doctorId);
    const incomingDoctorObjectId = new Types.ObjectId(incomingDoctorId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // validations
      if (incomingAppointmentChanges.doctorId) {
        const doctor = await this.usersService.fetchAuthorizedUser(
          incomingDoctorObjectId,
          clinicId.toString(),
          Role.DOCTOR,
          session,
        );
        internalIncomingChanges.doctorName = `${doctor.firstName} ${doctor.lastName}`;
      }

      const overlappingAppointment = await this.getOverlappingAppointment(
        {
          clinicId: existingAppointment.clinicId,
          doctorId: incomingDoctorObjectId
            ? incomingDoctorObjectId
            : existingDoctorObjectId,
          startTime: startTime,
          endTime: endTime,
        },
        existingAppointment._id,
        session,
      );

      if (overlappingAppointment.length > 0) {
        throw new BadRequestException(
          'The doctor is already booked or has an overlapping appointment during this time range.',
        );
      }

      const updatedDocument = await this.update(
        objectId,
        internalIncomingChanges,
        session,
      );

      await session.commitTransaction();

      return updatedDocument;
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to update this appointment in the database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while updating this appointment.',
      );
    } finally {
      await session.endSession();
    }
  }

  async updateAppointment(
    id: string,
    updateAppointmentInput: UpdateAppointmentInput,
  ) {
    const objectId = new Types.ObjectId(id);

    const existingAppointments = await this.find({ _id: id });

    if (existingAppointments.length === 0) {
      throw new NotFoundException('Appointment was not found in database.');
    }

    const existingAppointment = existingAppointments[0];

    const hasChanges = this.areThereAnyChanges(
      updateAppointmentInput,
      existingAppointment,
    );

    if (!hasChanges) {
      throw new BadRequestException(
        `The appointment is already up to date with the provided information.`,
      );
    }

    if (
      existingAppointment.status === AppointmentStatus.CANCELLED ||
      existingAppointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `This appointment cannot be modified because it has already been ${existingAppointment.status.toLowerCase()}.`,
      );
    }

    try {
      const updatedDocument = await this.routeAppointmentRequest(
        objectId,
        updateAppointmentInput,
        existingAppointment,
      );
      return updatedDocument;
    } catch (error) {
      if (error instanceof HttpException) {
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

  /** CRUD ENDPOINTS */
  private async update(
    objectId: Types.ObjectId,
    updateAppointmentInput: UpdateAppointmentInput,
    session?: ClientSession,
  ) {
    try {
      const query = this.appointmentModel
        .findByIdAndUpdate(
          objectId,
          { $set: updateAppointmentInput },
          {
            returnDocument: 'after',
          },
        )
        .lean();

      if (session) {
        query.session(session);
      }

      const updatedDocument = await query.exec();

      if (!updatedDocument) {
        throw new BadRequestException(
          `No appointment found with the provided ID: ${objectId}`,
        );
      }

      return updatedDocument;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to update this appointment from database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while updating this appointment.',
      );
    }
  }

  private async find(
    filters: Record<string, any>,
    session?: ClientSession,
  ): Promise<Appointment[]> {
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
}
