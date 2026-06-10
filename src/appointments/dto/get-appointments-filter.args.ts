import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@ArgsType()
export class AppointmentFiltersArgs {
  @Field(() => ID, {
    nullable: true,
    description: 'Filter appointments by a specific doctor ID',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Filter appointments by a specific patient ID',
  })
  @IsOptional()
  @IsString()
  patientId?: string;
}
