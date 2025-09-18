import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ERole } from 'src/configs/role.config';

export const Auth = (...roles: ERole[]) => {
  // console.log('Auth decorator roles:', roles);
  return applyDecorators(
    ApiBearerAuth(),
    SetMetadata('roles', roles),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
};

export const AuthUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: Record<string, unknown> }>();
    const user: Record<string, unknown> | undefined = request.user;
    return data ? user && user[data] : user;
  },
);
