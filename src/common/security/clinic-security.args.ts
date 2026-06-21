import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class SecurityClinicArgs {
  @Field(() => String, {
    description: 'Clinic ID for guard permission validation',
  })
  @IsNotEmpty()
  activeClinicId!: string;
}
