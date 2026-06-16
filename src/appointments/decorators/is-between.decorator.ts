import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ONE_MINUTE_IN_MILLISECONDS } from 'src/common/constants/app.constants';

export function IsBetween(
  relatedPropertyName: string,
  minBufferMinutes: number,
  maxBufferMinutes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBetween',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [relatedPropertyName, minBufferMinutes, maxBufferMinutes],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [comparisonField, minBuffer, maxBuffer] = args.constraints as [
            string,
            number,
            number,
          ];
          const comparisonValue = (args.object as Record<string, unknown>)[
            comparisonField
          ];

          if (!value || !comparisonValue) return true;

          const startTimeInMilliseconds = new Date(value).getTime();
          const endTimeInMilliseconds = new Date(
            comparisonValue as string,
          ).getTime();

          if (isNaN(startTimeInMilliseconds) || isNaN(endTimeInMilliseconds)) {
            return false;
          }

          const differenceInMinutes =
            Math.abs(startTimeInMilliseconds - endTimeInMilliseconds) /
            ONE_MINUTE_IN_MILLISECONDS;

          return (
            differenceInMinutes >= minBuffer && differenceInMinutes <= maxBuffer
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [startTimePropertyName, minBuffer, maxBuffer] =
            args.constraints as [string, number, number];
          return `${args.property} time difference from ${startTimePropertyName} must be between ${minBuffer} and ${maxBuffer} minutes.`;
        },
      },
    });
  };
}
