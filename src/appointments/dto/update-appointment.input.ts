import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Appointment } from '../schemas/appointment.schema';

@InputType()
export class UpdateAppointmentInput extends PartialType(
  OmitType(
    Appointment,
    ['_id', 'clinicId', 'createdAt', 'updatedAt'] as const,
    InputType,
  ),
) {}
