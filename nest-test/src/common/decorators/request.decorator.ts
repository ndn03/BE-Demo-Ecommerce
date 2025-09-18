import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 *
 * Custom decorator to extract a specific request parameter from the request object.
 * @param {string} key - The key of the parameter to extract from the request.
 * @param {ExecutionContext} ctx - The execution context containing the request.
 * @returns {any} - Returns the value of the request parameter.
 */
export const RequestParam = createParamDecorator(
  (key: string, ctx: ExecutionContext): unknown => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return (req as unknown as Record<string, unknown>)[key]; // Return the parameter based on the provided key
  },
);
