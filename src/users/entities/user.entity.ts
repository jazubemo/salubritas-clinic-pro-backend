import { Field, ObjectType, ID } from '@nestjs/graphql';
import { ClinicMembership } from '../../clinic-memberships/entities/clinic-membership.entity'; // Your updated GraphQL entity

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field({
    description:
      'The Honduran National Identification Document number. Format: 13 digits without hyphens.',
  })
  dni!: string;

  @Field({
    description: "The user's email. It's linked to firebase authentication.",
  })
  email!: string;

  @Field({
    description: "The user's given name(s). Includes first and middle names.",
  })
  firstName!: string;

  @Field({
    description: "The user's legal surname(s).",
  })
  lastName!: string;

  @Field({
    description:
      'The unique security identifier (UID) provided by Firebase Authentication.',
  })
  authId!: string;

  @Field(() => [ClinicMembership], {
    description: `Array of clinic memberships mapping locations to roles.`,
    nullable: true,
  })
  clinicMemberships?: ClinicMembership[];

  @Field({
    description: 'Exact date when the user profile was created',
  })
  createdAt!: Date;

  @Field({
    description: 'Date when the user profile was last updated',
  })
  updatedAt!: Date;

  // Virtual property resolver simulation
  @Field(() => String, {
    description: 'Computed property joining first and last name.',
  })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
