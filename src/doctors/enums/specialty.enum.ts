import { registerEnumType } from '@nestjs/graphql';

export enum Specialty {
  CARDIOTHORACIC_SURGERY = 'CARDIOTHORACIC_SURGERY',
  GENERAL_SURGERY = 'GENERAL_SURGERY',
  PEDIATRIC = 'PEDIATRIC',
  INTERNAL_MEDICINE = 'INTERNAL_MEDICINE',
}

registerEnumType(Specialty, {
  name: 'Specialty',
  description: 'Doctors specialty',
});
