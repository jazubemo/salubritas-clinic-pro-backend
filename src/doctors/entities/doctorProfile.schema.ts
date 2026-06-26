import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DoctorProfile {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
