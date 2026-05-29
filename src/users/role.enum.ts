import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  ADMIN = 'ADMIN',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'The available user roles within a clinic.',
});
