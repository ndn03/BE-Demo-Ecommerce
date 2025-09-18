import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

/**
 *
 * Validates an object against a given DTO class using class-validator.
 * This function will transform the plain object to an instance of the DTO class, validate it, and throw a BadRequestException if validation fails.
 * @param data The plain object that needs to be validated
 * @param dtoClass The class type of the DTO to validate the data against
 * @returns The transformed and validated DTO instance
 * @throws BadRequestException If validation fails, an exception with error messages is thrown
 */
export async function validateDto<T extends object>(
  data: object,
  dtoClass: new () => T,
): Promise<T> {
  // Transform the plain object into an instance of the DTO class.
  // Excludes properties that are not defined in the DTO class.
  const dtoInstance = plainToInstance(dtoClass, data, {
    excludeExtraneousValues: true, // Only include properties that are decorated with @Expose
  });

  // Validate the transformed DTO instance
  const errors = await validate(dtoInstance);

  // If there are validation errors, throw a BadRequestException with the error messages
  if (errors?.length > 0) {
    // Flatten all validation error messages into a single array
    const messages = errors
      .map((err) => Object.values(err.constraints || {})) // Extract all error constraints (messages)
      .flat(); // Flatten the array in case there are multiple error messages per field

    // Throw a BadRequestException with the error messages
    throw new BadRequestException(messages);
  }

  // Return the validated DTO instance if no errors were found
  return dtoInstance;
}
