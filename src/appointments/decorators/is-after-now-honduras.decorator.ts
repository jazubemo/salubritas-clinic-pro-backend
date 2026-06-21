import { registerDecorator, ValidationOptions } from 'class-validator';
import { DateTime } from 'luxon';
import { APP_TIMEZONE } from 'src/common/constants/app.constants';
import { TimezoneUtil } from 'src/common/utils/timezone.utils';

export function IsAfterNowHonduras(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterNowHonduras',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: Date) {
          if (!value) return true;

          const nowInHonduras = DateTime.now().setZone(APP_TIMEZONE);

          const incomingDate = TimezoneUtil.fromJSDate(value);

          return incomingDate > nowInHonduras;
        },
      },
    });
  };
}
