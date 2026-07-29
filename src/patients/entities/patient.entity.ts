// src/patients/entities/patient.entity.ts
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Patient {
  @Field(() => ID)
  id!: string;

  @Field({
    description: 'The unique ID linking this patient record to a core user.',
  })
  userId!: string;

  @Field(() => Date, {
    description: 'The calendar date of birth (stored as DATE in PostgreSQL).',
  })
  dateOfBirth!: Date;

  @Field(() => User, {
    nullable: true,
    description: 'The parent user profile associated with this patient.',
  })
  user?: User;

  @Field({ description: 'Exact date when the patient record was created' })
  createdAt!: Date;

  @Field({ description: 'Date when the patient record was last updated' })
  updatedAt!: Date;
}
