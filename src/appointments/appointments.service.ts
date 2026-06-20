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

import { CreateAppointmentInput } from './inputs/create-appointment.input';
import { UpdateAppointmentInput } from './inputs/update-appointment.input';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { AppointmentFiltersArgs } from './args/get-appointments-filter.args';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/role.enum';
import _ from 'lodash';
import { TimezoneUtil } from 'src/common/utils/timezone.utils';

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

  private async prepareNewAppointmentPayload(
    createAppointmentInput: CreateAppointmentInput,
    session: ClientSession,
  ) {
    const { patientId, doctorId, clinicId, ...restOfChanges } =
      createAppointmentInput;

    const patientObjectId = new Types.ObjectId(patientId);
    const doctorObjectId = new Types.ObjectId(doctorId);
    const clinicObjectId = new Types.ObjectId(clinicId);

    const doctor = await this.usersService.fetchAuthorizedUser(
      doctorObjectId,
      clinicObjectId,
      Role.DOCTOR,
      session,
    );

    const patient = await this.usersService.fetchAuthorizedUser(
      patientObjectId,
      clinicObjectId,
      Role.PATIENT,
      session,
    );

    return {
      ...restOfChanges,
      clinicId: clinicObjectId,
      doctorId: doctorObjectId,
      patientId: patientObjectId,
      startTime: TimezoneUtil.toUTC(createAppointmentInput.startTime),
      endTime: TimezoneUtil.toUTC(createAppointmentInput.endTime),
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
    };
  }

  async create(createAppointmentInput: CreateAppointmentInput) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const newAppointment = await this.prepareNewAppointmentPayload(
        createAppointmentInput,
        session,
      );

      const [overlappingAppointment] = await this.getOverlappingAppointment(
        {
          clinicId: newAppointment.clinicId,
          patientId: newAppointment.patientId,
          doctorId: newAppointment.doctorId,
          startTime: newAppointment.startTime,
          endTime: newAppointment.endTime,
        },
        undefined,
        session,
      );

      if (overlappingAppointment) {
        const isDoctorBusy =
          overlappingAppointment.doctorId.toString() ===
          newAppointment.doctorId.toString();

        const message = isDoctorBusy
          ? 'The doctor is already booked or has an overlapping appointment during this time range.'
          : 'The patient already has an appointment scheduled during this time range.';

        throw new ConflictException(message);
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
    const hasRescheduleUpdates =
      updateAppointmentInput.startTime ||
      updateAppointmentInput.endTime ||
      updateAppointmentInput.doctorId;

    if (hasRescheduleUpdates) {
      return this.reschedule(
        objectId,
        updateAppointmentInput,
        existingAppointment,
      );
    }

    return this.updateMetadata(objectId, updateAppointmentInput);
  }

  private isAfterNow(startTimeUTC: Date): boolean {
    const now = new Date();
    return startTimeUTC > now;
  }

  private transformToInternalUpdatePayload(
    incomingAppointmentChanges: UpdateAppointmentInput,
  ): Partial<Appointment> {
    const { doctorId, startTime, endTime, ...restOfChanges } =
      incomingAppointmentChanges;

    const internalChanges: Partial<Appointment> = { ...restOfChanges };

    if (doctorId) {
      internalChanges.doctorId = new Types.ObjectId(doctorId);
    }

    if (startTime) {
      internalChanges.startTime = TimezoneUtil.toUTC(startTime);
    }

    if (endTime) {
      internalChanges.endTime = TimezoneUtil.toUTC(endTime);
    }

    return internalChanges;
  }

  private async reschedule(
    objectId: Types.ObjectId,
    incomingAppointmentChanges: UpdateAppointmentInput,
    originalAppointment: Appointment,
  ) {
    const {
      clinicId,
      _id: originalAppointmentId,
      doctorId: originalDoctorId,
      startTime: originalStartTime,
      endTime: originalEndTime,
    } = originalAppointment;

    const updatedAppointment = this.transformToInternalUpdatePayload(
      incomingAppointmentChanges,
    );

    const {
      doctorId: updatedDoctorId,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
    } = updatedAppointment;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const doctorObjectId = updatedDoctorId
        ? updatedDoctorId
        : originalDoctorId;

      if (updatedDoctorId) {
        const doctor = await this.usersService.fetchAuthorizedUser(
          doctorObjectId,
          clinicId,
          Role.DOCTOR,
          session,
        );
        updatedAppointment.doctorName = `${doctor.firstName} ${doctor.lastName}`;
      }

      const startTime = updatedStartTime ? updatedStartTime : originalStartTime;
      const endTime = updatedEndTime ? updatedEndTime : originalEndTime;

      if (!this.isAfterNow(startTime)) {
        throw new BadRequestException(
          'This appointment has already passed and cannot be modified. Please schedule a new appointment.',
        );
      }

      const overlappingAppointment = await this.getOverlappingAppointment(
        {
          clinicId: clinicId,
          doctorId: doctorObjectId,
          startTime: startTime,
          endTime: endTime,
        },
        originalAppointmentId,
        session,
      );

      if (overlappingAppointment.length > 0) {
        throw new BadRequestException(
          'The doctor is already booked or has an overlapping appointment during this time range.',
        );
      }

      const updatedDocument = await this.update(
        objectId,
        updatedAppointment,
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

  private ensureAppointmentCanBeUpdated(
    incomingChanges: UpdateAppointmentInput,
    existingAppointment: Appointment,
  ) {
    const hasNull = _.includes(_.values(incomingChanges), null);
    if (hasNull) {
      throw new BadRequestException(
        'Cannot save updates. If you do not wish to update a field, please omit it from the request completely instead of sending null.',
      );
    }

    const hasChanges = this.areThereAnyChanges(
      incomingChanges,
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
  }

  async updateAppointment(
    id: string,
    updateAppointmentInput: UpdateAppointmentInput,
  ) {
    const [existingAppointment] = await this.find({ _id: id });

    if (!existingAppointment) {
      throw new NotFoundException('Appointment was not found in database.');
    }

    this.ensureAppointmentCanBeUpdated(
      updateAppointmentInput,
      existingAppointment,
    );

    try {
      const updatedDocument = await this.routeAppointmentRequest(
        new Types.ObjectId(id),
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
      const { startRange, endRange, doctorId, patientId } = filters;

      const startInputUtc = TimezoneUtil.toUTC(startRange);
      const endInputUtc = TimezoneUtil.toUTC(endRange);

      const isChronological = startInputUtc < endInputUtc;
      const startRangeUtc = isChronological ? startInputUtc : endInputUtc;
      const endRangeUtc = isChronological ? endInputUtc : startInputUtc;

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

      if (doctorId) {
        query.doctorId = new Types.ObjectId(filters?.doctorId);
      }

      if (patientId) {
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
    updateAppointmentInput: Partial<Appointment> | UpdateAppointmentInput,
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
