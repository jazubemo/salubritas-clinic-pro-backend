import { Field, InputType, OmitType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { Appointment } from '../schemas/appointment.schema';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinDate,
} from 'class-validator';
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
  [
    '_id',
    'createdAt',
    'updatedAt',
    'patientName',
    'doctorName',
    'startTime', // field omitted because it needs special validations
    'endTime', // field omitted because it needs special validations
    'status', // field omitted because it needs special validations
  ] as const,
  InputType,
) {
  @Field(() => Date)
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), {
    message: `The appointment's start date must be later than right now.`,
  })
  startTime!: Date;

  @Field(() => Date)
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

  @Field(() => AppointmentStatus)
  @IsNotEmpty()
  @IsIn([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED], {
    message: 'Status must be either PENDING or CONFIRMED',
  })
  status!: AppointmentStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
