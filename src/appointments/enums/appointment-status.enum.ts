import { registerEnumType } from '@nestjs/graphql';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

registerEnumType(AppointmentStatus, {
  name: 'AppointmentStatus',
  description: 'The current operational status of the appointments',
});
