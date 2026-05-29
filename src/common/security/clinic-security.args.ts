import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class SecurityClinicArgs {
  @Field(() => String, {
    description: 'Clinic ID for guard permission validation',
  })
  activeClinicId!: string;
}
