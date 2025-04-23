import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function AtLeastOne(propertyNames: string[], validationOptions?: ValidationOptions) {
  return function (object: Object) {
    registerDecorator({
      name: 'AtLeastOne',
      target: object.constructor,
      propertyName: '__atLeastOne__',
      options: validationOptions,
      constraints: propertyNames,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as Record<string, any>;
          return propertyNames.some((field) => obj[field] !== undefined && obj[field] !== null);
        },
        defaultMessage(args: ValidationArguments) {
          return `Хотя бы одно из полей должно быть заполнено: ${args.constraints.join(', ')}`;
        },
      },
    });
  };
}
