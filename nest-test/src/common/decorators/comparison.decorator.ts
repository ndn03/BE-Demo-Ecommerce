import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Define supported comparison operators
type TComparison = 'eq' | 'gt' | 'gte' | 'in' | 'lt' | 'lte' | 'ne' | 'nin';
//eq = Bằng nhau, data types: number, string
//gt = Lớn hơn, data types: number, Date
//gte = Lớn hơn hoặc bằng, data types: number, Date
//in = Có trong mảng, data types: number, string, Date
//lt = Nhỏ hơn, data types: number, Date
//lte = Nhỏ hơn hoặc bằng, data types: number, Date
//ne = Khác nhau, data types: number, string
//nin = Không có trong mảng, data types: number, string, Date
// Example usage in a DTO
//   @Comparison(18, 'gte', { message: 'Tuổi phải >= 18' })
//   age: number;

//   @Comparison('age', 'gt', { message: 'Tuổi nghỉ hưu phải lớn hơn tuổi hiện tại' })
//   retirementAge: number;

//   @Comparison(['admin', 'user'], 'in', { message: 'Vai trò không hợp lệ' })
//   role: string;

//   @Comparison('startDate', 'lt', { message: 'endDate phải lớn hơn startDate' })
//   endDate: Date;

//   startDate: Date;
// }

//nin = Không có trong mảng, data types: number, string, Date

// Define supported types for comparison (key of T, number, Date, or array)
type TSupportedTypes<T> = keyof T | number | Date | T[];

/**
 * Compares a property value against another value or property.
 * @param valueOrProperty The value to compare or the property name to compare against
 * @param operator The comparison operator (e.g., eq, gt, lt, in, ...)
 * @param validationOptions Validation options for customizing error messages or other options
 */
export function Comparison<T>(
  valueOrProperty: TSupportedTypes<T>,
  operator: TComparison,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    // Register the custom decorator with the validation system
    registerDecorator({
      name: 'Comparison', // Name of the custom decorator
      target: object.constructor, // The class that owns the property being validated
      propertyName, // Name of the property to validate
      constraints: [valueOrProperty, operator], // The parameters for comparison: value or property and operator
      options: validationOptions, // Validation options (e.g., error message customization)

      /**
       * Perform the comparison between the property value and the reference value.
       * @param value The value of the property being validated
       * @param args The validation context including the object and constraints
       */
      validator: {
        validate(value: TSupportedTypes<T>, args: ValidationArguments) {
          // Destructure the constraints array to get the value or property and the operator
          const [propertyOrValue, op] = args.constraints as [
            TSupportedTypes<T>,
            TComparison,
          ];

          // Retrieve the reference value (either from a property or directly provided)
          let relatedValue: number | Date | string | undefined;
          if (propertyOrValue instanceof Date) {
            relatedValue = propertyOrValue; // If it's a Date, use it directly
          } else if (typeof propertyOrValue === 'string') {
            // If it's a property name, get the value from the object
            relatedValue = args.object[
              propertyOrValue as keyof typeof args.object
            ] as number | Date;
          } else {
            relatedValue = propertyOrValue as number; // If it's a number, use it directly
          }

          // If the reference value is valid (non-null)
          if (relatedValue != null) {
            // If the reference value is an array, handle comparison for 'in' or 'nin' operators
            if (Array.isArray(relatedValue)) {
              switch (op) {
                case 'in':
                  return relatedValue.includes(value); // Check if value is in the array
                case 'nin':
                  return !relatedValue.includes(value); // Check if value is not in the array
                default:
                  throw new Error(`Invalid operator: ${op}`); // Error for unsupported operator
              }
            }

            // Compare Date values (if both value and reference are Date objects)
            if (value instanceof Date && relatedValue instanceof Date) {
              switch (op) {
                case 'eq':
                  return value.getTime() === relatedValue.getTime(); // Equal
                case 'gt':
                  return value.getTime() > relatedValue.getTime(); // Greater than
                case 'gte':
                  return value.getTime() >= relatedValue.getTime(); // Greater than or equal
                case 'lt':
                  return value.getTime() < relatedValue.getTime(); // Less than
                case 'lte':
                  return value.getTime() <= relatedValue.getTime(); // Less than or equal
                case 'ne':
                  return value.getTime() !== relatedValue.getTime(); // Not equal
                default:
                  throw new Error(`Invalid operator: ${op}`); // Error for unsupported operator
              }
            }

            // Compare string values (if both value and reference are strings)
            if (
              (!(value instanceof Date) || !(relatedValue instanceof Date)) &&
              typeof value === 'string' &&
              typeof relatedValue === 'string'
            ) {
              switch (op) {
                case 'eq':
                  return value === relatedValue; // Equal
                case 'ne':
                  return value !== relatedValue; // Not equal
                default:
                  throw new Error(`Invalid operator: ${op}`); // Error for unsupported operator
              }
            }

            // Compare number values (if both value and reference are numbers)
            if (typeof value === 'number' && typeof relatedValue === 'number') {
              switch (op) {
                case 'eq':
                  return value === relatedValue; // Equal
                case 'gt':
                  return value > relatedValue; // Greater than
                case 'gte':
                  return value >= relatedValue; // Greater than or equal
                case 'lt':
                  return value < relatedValue; // Less than
                case 'lte':
                  return value <= relatedValue; // Less than or equal
                case 'ne':
                  return value !== relatedValue; // Not equal
                default:
                  throw new Error(`Invalid operator: ${op}`); // Error for unsupported operator
              }
            }

            // Throw error if comparison between unsupported data types is attempted
            throw new Error(
              `Unsupported comparison between ${typeof value} and ${typeof relatedValue}`,
            );
          }

          // Return true if the value is null or invalid (optional: you can handle this case later)
          return true;
        },

        /**
         * Provides the default error message when validation fails.
         * @param args The validation arguments
         */
        defaultMessage(args: ValidationArguments) {
          const [propertyOrValue] = args.constraints as [
            TSupportedTypes<T>,
            TComparison,
          ];
          const target =
            propertyOrValue instanceof Date
              ? 'value' // If the reference is a Date
              : `property ${String(propertyOrValue)}`; // If the reference is a property name
          return `${propertyName} must satisfy the "${operator}" condition with ${target}.`;
        },
      },
    });
  };
}
