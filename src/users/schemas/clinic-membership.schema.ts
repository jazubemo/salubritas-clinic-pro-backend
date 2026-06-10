import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserStatus } from '../enums/user-status.enum';
import { Role } from './../enums/role.enum';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Schema({ _id: true, timestamps: true })
export class ClinicMembership {
  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId!: Types.ObjectId;

  @Field(() => String)
  @Prop({ required: true })
  name!: string;

  @Field(() => UserStatus, {
    description:
      'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
  })
  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Field(() => [Role])
  @Prop({ type: [String], required: true, enum: Role })
  roles!: Role[];
}

export const ClinicMembershipSchema =
  SchemaFactory.createForClass(ClinicMembership);
