import { Appointment } from '../schemas/appointment.schema';
import { InputType, OmitType } from '@nestjs/graphql';

@InputType()
export class UpdateAppointmentInput extends OmitType(
  Appointment,
  ['_id', 'clinicId', 'createdAt', 'updatedAt'] as const,
  InputType,
) {}
