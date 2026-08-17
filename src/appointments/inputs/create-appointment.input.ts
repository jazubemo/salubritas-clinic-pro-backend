import { Field, InputType, OmitType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { IsAfter } from '../decorators/is-after.decorator';
import { IsBetween } from '../decorators/is-between.decorator';
import {
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from 'src/common/constants/app.constants';
import { IsAfterNowHonduras } from '../decorators/is-after-now-honduras.decorator';
import { Appointment } from '../entities/appointment.entity';

@InputType()
export class CreateAppointmentInput extends OmitType(
  Appointment,
  ['id', 'createdAt', 'updatedAt', 'startTime', 'endTime', 'status'] as const,
  InputType,
) {
  @Field(() => Date)
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfterNowHonduras({
    message: `The appointment's start date must be later than right now in Honduras time.`,
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
