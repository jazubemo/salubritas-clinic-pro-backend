import { registerEnumType } from '@nestjs/graphql';

export enum Status {
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
}

registerEnumType(Status, {
  name: 'Status',
  description:
    'The current operational status of the user account. Allowed values: ACTIVE, ARCHIVED.',
});
