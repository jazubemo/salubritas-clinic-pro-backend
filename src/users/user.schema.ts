import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';
import { Role } from './role.enum';
import { Status } from './status.enum';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType() // GraphQL Decorator
@Schema({ timestamps: true })
export class User extends Document {
  @Field(() => ID)
  declare _id: Types.ObjectId;

  @Field({
    description:
      'The Honduran National Identification Document number. Format: 13 digits without hyphens (e.g., 0801199512345).',
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  dni!: string;

  @Field({
    description:
      "The user's given name(s). Includes first and middle names (e.g., 'Carlos Alberto').",
  })
  @Prop({ required: true })
  firstName!: string;

  @Field({
    description: "The user's legal surname(s).",
  })
  @Prop({ required: true })
  lastName!: string;

  @Field({
    description:
      'The unique security identifier (UID) provided by Firebase Authentication. Used to map the database user to their authenticated identity.',
  })
  @Prop({ required: true, unique: true, index: true })
  authId!: string;

  @Field(() => GraphQLJSON, {
    description: `Map of clinic IDs to the user's assigned roles at each location.`,
  })
  @Prop({ required: true, type: Object, default: {} })
  clinicRoles!: Record<string, Role[]>;

  @Field({
    description:
      'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
  })
  @Prop({ required: true, enum: Status, default: Status.ACTIVE })
  status!: string;

  // @Field()
  // @Prop({ required: true, enum: Role, default: [Role.PATIENT] })
  // roles!: [Role];

  // @Field()
  // @Prop({ required: true })
  // createdAt!: Date;

  // @Field()
  // @Prop({ required: true })
  // createdBy!: Types.ObjectId;

  // @Field()
  // @Prop({ required: true })
  // updatedAt!: Date;

  // @Field()
  // @Prop({ required: true })
  // updatedBy!: Types.ObjectId;

  // @Field({ nullable: true })
  // @Prop()
  // lastLogin?: Date;

  // @Field({ nullable: true })
  // @Prop()
  // email?: string;

  // @Field({ nullable: true })
  // @Prop()
  // phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
