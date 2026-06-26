import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { SPECIALTY } from '../enums/specialty.enum';

@ObjectType()
@Schema({ timestamps: true })
export class DoctorProfile {
  @Field(() => String)
  @Prop({ type: String, required: true, unique: true, trim: true })
  licenseNumber!: string;

  @Field(() => SPECIALTY, { nullable: true })
  @Prop({
    type: String,
    enum: Object.values(SPECIALTY),
    required: false,
  })
  specialty?: SPECIALTY;

  @Field(() => Date, {
    description: 'Exact date when the doctor data was created',
    nullable: true,
  })
  createdAt?: Date;

  @Field(() => Date, {
    description: 'Date when the doctor data was last updated',
    nullable: true,
  })
  updatedAt?: Date;
}

export const DoctorProfileSchema = SchemaFactory.createForClass(DoctorProfile);
