import { BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [comparisonField] = args.constraints as [string];
          const comparisonValue = (args.object as Record<string, unknown>)[
            comparisonField
          ] as string;

          if (!value || !comparisonValue) {
            throw new BadRequestException(
              'Both startTime and endTime are required properties for this action.',
            );
          }

          const endTimeInMilliseconds = new Date(value).getTime();
          const startTimeInMilliseconds = new Date(comparisonValue).getTime();

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

          return endTimeInMilliseconds > startTimeInMilliseconds;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}.`;
        },
      },
    });
  };
}
