import { registerEnumType } from '@nestjs/graphql';

export enum SPECIALTY {
  CARDIOLOGY = 'CARDIOLOGY',
  GENERAL_SURGERY = 'GENERAL_SURGERY',
  PEDIATRIC = 'PEDIATRIC',
  INTERNAL_MEDICINE = 'INTERNAL_MEDICINE',
}

registerEnumType(SPECIALTY, {
  name: 'Specialty',
  description: 'Doctors specialty',
});
