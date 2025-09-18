import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
//example  @IsUniqueFieldInArray('label', {
//   message: 'Các nhãn (label) không được trùng nhau.',
// })
export function IsUniqueFieldInArray(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueFieldInArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown) {
          if (!Array.isArray(value)) return false;

          const labels = (value as Array<{ label?: string }>).map(
            (item) => item?.label,
          );
          const uniqueLabels = new Set(labels);
          return labels.length === uniqueLabels.size;
        },
        defaultMessage(args: ValidationArguments) {
          return `The ${args.property} array contains duplicate labels. Each label must be unique.`;
        },
      },
    });
  };
}
