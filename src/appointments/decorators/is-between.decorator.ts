import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ONE_MINUTE_IN_MILLISECONDS } from 'src/common/constants/app.constants';

export function IsBetween(
  relatedPropertyName: string, // e.g., 'startTime'
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
          const [startTimePropertyName, minBuffer, maxBuffer] =
            args.constraints as [string, number, number];
          const startTimeValue = (args.object as Record<string, unknown>)[
            startTimePropertyName
          ];

          const startTimeInMilliseconds = new Date(value).getTime();
          const endTimeInMilliseconds = new Date(
            startTimeValue as string,
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
