import { InputType, Field } from '@nestjs/graphql';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import {
  IsDate,
  IsNotIn,
  IsOptional,
  MinDate,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBetween } from '../decorators/is-between.decorator';
import { IsAfter } from '../decorators/is-after.decorator';
import {
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from 'src/common/constants/app.constants';

@InputType()
export class UpdateAppointmentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
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
  status?: AppointmentStatus;

  @Field(() => Date, { nullable: true })
  @Type(() => Date) // Critical for converting GraphQL ISO strings back to JavaScript Date Objects
  @IsDate()
  @MinDate(new Date(), {
    message: `The appointment's start date must be later than right now.`,
  })
  @IsOptional()
  startTime?: Date;

  @Field(() => Date, { nullable: true })
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
  @IsOptional()
  endTime?: Date;
}
