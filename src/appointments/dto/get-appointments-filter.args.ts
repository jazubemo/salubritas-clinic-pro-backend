import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@ArgsType()
export class AppointmentFiltersArgs {
  @Field(() => String, {
    nullable: false,
    description: 'Filter appointments by started date',
  })
  @IsString()
  @IsNotEmpty()
  startRangeString!: string;

  @Field(() => String, {
    nullable: false,
    description: 'Filter appointments by end date',
  })
  @IsString()
  @IsNotEmpty()
  endRangeString!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  timezone!: string;

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
