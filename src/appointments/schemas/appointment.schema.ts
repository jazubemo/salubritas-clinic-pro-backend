import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Document, HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { IsNotEmpty } from 'class-validator';

export type AppointmentDocument = HydratedDocument<Appointment>;

@ObjectType()
@Schema({ timestamps: true })
export class Appointment {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => ID, {
    description: 'Clinic where the appointment was created.',
  })
  @Prop({ type: Types.ObjectId, required: true })
  @IsNotEmpty()
  clinicId!: Types.ObjectId;

  @Field({
    description: 'Exact date and time when the appointment starts',
  })
  @Prop({
    type: Date,
    required: true,
  })
  startTime!: Date;

  @Field({
    description: 'Exact date and time when the appointment ends',
  })
  @Prop({
    type: Date,
    required: true,
  })
  endTime!: Date;

  @Field(() => AppointmentStatus, {
    description: 'The current operational status of the appointments.',
  })
  @Prop({
    type: String,
    required: true,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Field({
    description:
      'States if the user who scheduled the appointment is a new user in the system',
  })
  @Prop({ required: true })
  @IsNotEmpty()
  isNewPatient!: boolean;

  @Field(() => String, {
    description: 'It explains why the appointment was created.',
    nullable: true,
  })
  @Prop({ required: false })
  reason?: string;

  @Field(() => ID, { description: 'The user that requested the appointment' })
  @Prop({ type: Types.ObjectId, required: true })
  @IsNotEmpty()
  patientId!: Types.ObjectId;

  @Field({
    description: "The patient's full name.",
  })
  @Prop({ required: true })
  patientName!: string;

  @Field(() => ID, {
    description: 'The doctor that will attend the appointment.',
  })
  @Prop({ type: Types.ObjectId, required: true })
  @IsNotEmpty()
  doctorId!: Types.ObjectId;

  @Field({
    description: "The doctor's full name.",
  })
  @Prop({ required: true })
  doctorName!: string;

  @Field({
    description: 'Exact date when the appointment was created',
    nullable: true,
  })
  @Prop({
    type: Date,
    required: false,
  })
  createdAt?: Date;

  @Field({
    description: 'Date when the appointment was last updated',
    nullable: true,
  })
  @Prop({
    type: Date,
  })
  updatedAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// compound indexes
AppointmentSchema.index({ clinicId: 1, status: 1, startTime: 1 });
AppointmentSchema.index({ clinicId: 1, doctorId: 1, status: 1, startTime: 1 });
AppointmentSchema.index({ clinicId: 1, patientId: 1, status: 1, startTime: 1 });
