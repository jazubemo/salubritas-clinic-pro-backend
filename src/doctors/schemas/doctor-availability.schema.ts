import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
@Schema({ _id: true })
export class DoctorAvailability {
  @Field(() => [Int])
  @Prop({ type: [Number], required: true })
  daysOfWeek!: number[];

  @Field(() => String)
  @Prop({ type: String, required: true })
  startTime!: string; // e.g., "06:00"

  @Field(() => String)
  @Prop({ type: String, required: true })
  endTime!: string; // e.g., "12:00"
}

export const DoctorAvailabilitySchema =
  SchemaFactory.createForClass(DoctorAvailability);
