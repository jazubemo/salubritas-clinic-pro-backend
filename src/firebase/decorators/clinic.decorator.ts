import { SetMetadata } from '@nestjs/common';

export const CHECK_CLINIC_KEY = 'activeClinicId';
// This decorator allows you to define which role can access the clinic
export const RequireClinicRole = (role: string) =>
  SetMetadata(CHECK_CLINIC_KEY, role);
