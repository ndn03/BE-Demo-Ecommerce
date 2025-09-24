// validators/IsBetweenRange.ts
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import * as dayjs from 'dayjs';

type Unit = 'day' | 'week' | 'month' | 'year';

type TSupportedTypes<T> = keyof T | number | Date | T[];

export function IsBetweenRange<T>(
  fieldA: TSupportedTypes<T>,
  fieldBOrOffset: TSupportedTypes<T> | number,
  unit?: Unit,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBetweenRange',
      target: object.constructor,
      propertyName,
      constraints: [fieldA, fieldBOrOffset, unit],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [fieldA, fieldBOrOffset, unit] = args.constraints;
          const obj = args.object as any;

          if (!value || !obj[fieldA]) return true;

          const base = dayjs(obj[fieldA]);
          const val = dayjs(value);

          let start: dayjs.Dayjs;
          let end: dayjs.Dayjs;

          if (typeof fieldBOrOffset === 'number' && unit) {
            // Case 1: field + offset
            const offset = fieldBOrOffset as number;
            if (offset >= 0) {
              start = base;
              end = base.add(offset, unit);
            } else {
              start = base.add(offset, unit);
              end = base;
            }
          } else if (typeof fieldBOrOffset === 'string') {
            // Case 2: two fields
            const secondField = fieldBOrOffset as string;
            if (!obj[secondField]) return true;
            const other = dayjs(obj[secondField]);
            if (base.isBefore(other)) {
              start = base;
              end = other;
            } else {
              start = other;
              end = base;
            }
          } else {
            return false;
          }

          return (
            val.isSame(start) ||
            val.isSame(end) ||
            (val.isAfter(start) && val.isBefore(end))
          );
        },

        defaultMessage(args: ValidationArguments) {
          const [fieldA, fieldBOrOffset, unit] = args.constraints;
          if (typeof fieldBOrOffset === 'number') {
            return `$property must be between ${fieldA} and ${fieldA} + ${fieldBOrOffset} ${unit}`;
          } else {
            return `$property must be between ${fieldA} and ${fieldBOrOffset}`;
          }
        },
      },
    });
  };
}
