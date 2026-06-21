import { registerEnumType } from '@nestjs/graphql';

export enum UserStatus {
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
}

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description:
    'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
});
