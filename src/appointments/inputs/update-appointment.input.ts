import { InputType, Field } from '@nestjs/graphql';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import {
  IsNotIn,
  IsOptional,
  IsBoolean,
  IsString,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { IsBetween } from '../decorators/is-between.decorator';
import { IsAfter } from '../decorators/is-after.decorator';
import {
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from 'src/common/constants/app.constants';
import { IsAfterNowHonduras } from '../decorators/is-after-now-honduras.decorator';

@InputType()
export class UpdateAppointmentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty({
    message: 'The doctorId cannot be empty if it is provided.',
  })
  doctorId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  @IsNotEmpty({
    message: 'The isNewPatient cannot be empty if it is provided.',
  })
  isNewPatient?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field(() => AppointmentStatus, { nullable: true })
  @IsNotIn([AppointmentStatus.COMPLETED], {
    message:
      "The status 'COMPLETED' cannot be changed manually. This status is assigned automatically when the doctor generates a medical record.",
  })
  @IsOptional()
  @IsNotEmpty({
    message: 'The status cannot be empty if it is provided.',
  })
  status?: AppointmentStatus;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsAfterNowHonduras({
    message: `The appointment start time must be a date and time in the future (Honduras local time).`,
  })
  @IsOptional()
  @IsNotEmpty({
    message: 'The startTime cannot be empty if it is provided.',
  })
  startTime?: Date;

  @Field(() => Date, { nullable: true })
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
  @IsOptional()
  @IsNotEmpty({
    message: 'The endTime cannot be empty if it is provided.',
  })
  endTime?: Date;
}
