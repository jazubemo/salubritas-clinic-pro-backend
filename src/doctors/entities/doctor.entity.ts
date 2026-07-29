import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Specialty } from '../../doctors/enums/specialty.enum';

@ObjectType()
export class Doctor {
  @Field(() => ID)
  id!: string;

  @Field({
    description: 'The unique ID linking this doctor record to a core user.',
  })
  userId!: string;

  @Field(() => Specialty, {
    description: 'The registered medical specialty of the doctor.',
  })
  specialty!: Specialty;

  @Field({
    description: 'The doctor unique medical license identification string.',
  })
  licenseNumber!: string;

  @Field(() => User, {
    nullable: true,
    description: 'The parent user profile associated with this doctor.',
  })
  user?: User;

  @Field({ description: 'Exact date when the doctor record was created' })
  createdAt!: Date;

  @Field({ description: 'Date when the doctor record was last updated' })
  updatedAt!: Date;
}
