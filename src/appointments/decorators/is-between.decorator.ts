import { BadRequestException } from '@nestjs/common';
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
          ] as string;

          if (!value || !comparisonValue) {
            throw new BadRequestException(
              'Both startTime and endTime are required properties for this action.',
            );
          }

          const startTimeInMilliseconds = new Date(value).getTime();
          const endTimeInMilliseconds = new Date(comparisonValue).getTime();

          if (isNaN(startTimeInMilliseconds)) {
            throw new BadRequestException(
              `The provided startTime value ("${comparisonValue}") is not a valid date string. Please use a valid ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ssZ").`,
            );
          }

          if (isNaN(endTimeInMilliseconds)) {
            throw new BadRequestException(
              `The provided endTime value ("${value}") is not a valid date string. Please use a valid ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ssZ").`,
            );
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
