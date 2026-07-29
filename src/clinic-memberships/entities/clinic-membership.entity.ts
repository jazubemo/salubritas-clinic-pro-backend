import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserStatus } from '../../users/enums/user-status.enum';
import { Role } from '../../users/enums/role.enum';

@ObjectType()
export class ClinicMembership {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  clinicId!: string;

  @Field(() => String, {
    description:
      'The name of the clinic. Resolved dynamically from the Clinics table.',
  })
  name!: string;

  @Field(() => UserStatus, {
    description:
      'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
  })
  status!: UserStatus;

  @Field(() => [Role])
  roles!: Role[];

  @Field({ description: 'Timestamp when membership was created' })
  createdAt!: Date;

  @Field({ description: 'Timestamp when membership was last updated' })
  updatedAt!: Date;
}
