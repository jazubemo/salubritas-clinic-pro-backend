import { InputType, PartialType, OmitType, Field } from '@nestjs/graphql';
import { Appointment } from '../schemas/appointment.schema';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { IsDate, IsNotIn, IsOptional, MinDate } from 'class-validator';
import { Type } from 'class-transformer';
import { IsBetween } from '../decorators/is-between.decorator';
import {
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from 'src/common/constants/app.constants';
import { IsAfter } from '../decorators/is-after.decorator';

@InputType()
export class UpdateAppointmentInput extends PartialType(
  OmitType(
    Appointment,
    [
      '_id',
      'clinicId',
      'createdAt',
      'updatedAt',
      'patientName',
      'doctorName',
      'patientId', // no real use cases. If a doctor doesn't want to attend this patient, a different doctor can be assigned.
    ] as const,
    InputType,
  ),
) {
  @Field(() => AppointmentStatus)
  @IsOptional()
  @IsNotIn([AppointmentStatus.COMPLETED], {
    message:
      "The status 'COMPLETED' cannot be changed manually. This status is assigned automatically when the doctor generates a medical record.",
  })
  status?: AppointmentStatus;

  @Field(() => Date)
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), {
    message: `The appointment's start date must be later than right now.`,
  })
  startTime?: Date;

  @Field(() => Date)
  @IsOptional()
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
}
