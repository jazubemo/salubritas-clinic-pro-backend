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

          if (!value || !comparisonValue) return true;

          const endDateInMilliseconds = new Date(value).getTime();
          const startDateInMilliseconds = new Date(comparisonValue).getTime();

          if (isNaN(endDateInMilliseconds) || isNaN(startDateInMilliseconds)) {
            return false;
          }

          return endDateInMilliseconds > startDateInMilliseconds;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}.`;
        },
      },
    });
  };
}
