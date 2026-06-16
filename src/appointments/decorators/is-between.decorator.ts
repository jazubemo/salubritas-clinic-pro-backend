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
          const [relatedPropertyName] = args.constraints as string[];

          const dateToValidate = new Date(value);

          const relatedDate = new Date(relatedPropertyName);
          if (isNaN(dateToValidate.getTime()) || isNaN(relatedDate.getTime())) {
            return false;
          }

          console.log(
            'dateToValidate.getTime() > relatedDate.getTime()',
            dateToValidate.getTime() > relatedDate.getTime(),
          );

          return dateToValidate.getTime() > relatedDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}.`;
        },
      },
    });
  };
}
