import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Status } from './status.enum';
import { Role } from './role.enum';
import { Field } from '@nestjs/graphql';

@Schema({ _id: true })
export class ClinicMembership {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Field({
    description:
      'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
  })
  @Prop({
    required: true,
    enum: Status,
    default: Status.ACTIVE,
  })
  status!: string;

  @Prop({ type: [Role], required: true })
  roles!: Role[];
}

export const ClinicMembershipSchema =
  SchemaFactory.createForClass(ClinicMembership);
