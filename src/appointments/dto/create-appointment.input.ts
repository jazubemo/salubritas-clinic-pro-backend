import { InputType, OmitType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { Appointment } from '../schemas/appointment.schema';
import { IsDate, IsIn, IsNotEmpty, MinDate } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { IsAfter } from '../decorators/is-after.decorator';
import { IsBetween } from '../decorators/is-between.decorator';
import {
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from 'src/common/constants/app.constants';

@InputType()
export class CreateAppointmentInput extends OmitType(
  Appointment,
  ['_id', 'createdAt', 'updatedAt', 'patientName', 'doctorName'] as const,
  InputType,
) {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), {
    message: `The appointment's start date must be later than right now.`,
  })
  startTime!: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsBetween(
    'startTime',
    MIN_APPOINTMENT_DURATION_MINUTES,
    MAX_APPOINTMENT_DURATION_MINUTES,
    {
      message: `The appointment should last between ${MIN_APPOINTMENT_DURATION_MINUTES} and ${MAX_APPOINTMENT_DURATION_MINUTES} minutes`,
    },
  )
  @IsAfter('startTime', {
    message: `The appointment's end date must be later than start date.`,
  })
  endTime!: Date;

  @IsNotEmpty()
  @IsIn([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED], {
    message: 'Status must be either PENDING or CONFIRMED',
  })
  status!: AppointmentStatus;
}
