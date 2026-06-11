import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@ArgsType()
export class AppointmentFiltersArgs {
  @Field(() => String, {
    nullable: false,
    description: 'Filter appointments by started date',
  })
  @IsISO8601()
  @IsNotEmpty()
  startDate!: string;

  @Field(() => String, {
    nullable: false,
    description: 'Filter appointments by end date',
  })
  @IsISO8601()
  @IsNotEmpty()
  endDate!: string;

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
