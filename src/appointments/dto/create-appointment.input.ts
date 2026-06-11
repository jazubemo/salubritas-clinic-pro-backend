import { InputType, OmitType } from '@nestjs/graphql';
import { Appointment } from '../schemas/appointment.schema';

@InputType()
export class CreateAppointmentInput extends OmitType(
  Appointment,
  ['_id'] as const,
  InputType,
) {}
