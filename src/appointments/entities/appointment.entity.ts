import { Field, ObjectType, ID } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsDate,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@ObjectType()
export class Appointment {
  @Field(() => ID)
  @IsString()
  id!: string;

  @Field(() => ID, {
    description: 'Clinic where the appointment was created.',
  })
  @IsNotEmpty()
  @IsString()
  clinicId!: string;

  @Field({
    description: 'Exact date and time when the appointment starts',
  })
  @IsDate()
  startTime!: Date;

  @Field({
    description: 'Exact date and time when the appointment ends',
  })
  @IsDate()
  endTime!: Date;

  @Field(() => AppointmentStatus, {
    description: 'The current operational status of the appointments.',
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @Field({
    description:
      'States if the user who scheduled the appointment is a new user in the system',
  })
  @IsBoolean()
  isNewPatient!: boolean;

  @Field(() => String, {
    description: 'It explains why the appointment was created.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @Field(() => ID, { description: 'The user that requested the appointment' })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @Field(() => ID, {
    description: 'The doctor that will attend the appointment.',
  })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @Field(() => Patient, { description: 'The full patient record' })
  patient?: Patient;

  @Field(() => Doctor, { description: 'The full doctor record' })
  doctor?: Doctor;

  @Field({
    description: 'Exact date when the appointment was created',
    nullable: true,
  })
  @IsDate()
  createdAt!: Date;

  @Field({
    description: 'Date when the appointment was last updated',
    nullable: true,
  })
  @IsDate()
  updatedAt!: Date;
}
