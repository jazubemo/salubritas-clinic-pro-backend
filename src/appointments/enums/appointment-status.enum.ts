import { registerEnumType } from '@nestjs/graphql';
import * as PrismaEnums from 'generated/prisma/enums';

export const AppointmentStatus = PrismaEnums.AppointmentStatus;

export type AppointmentStatus = PrismaEnums.AppointmentStatus;

registerEnumType(AppointmentStatus, {
  name: 'AppointmentStatus',
  description: 'The current operational status of the appointments',
});
