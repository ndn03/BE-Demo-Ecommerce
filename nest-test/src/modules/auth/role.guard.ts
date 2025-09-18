import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class RoleGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    // console.log('Required roles:', roles); // Log danh sách vai trò
    if (!roles) {
      // console.log('No roles required, allowing access');
      return true;
    }
    const isAuth = await super.canActivate(context);
    // console.log('JWT Auth result:', isAuth); // Log kết quả xác thực JWT
    if (!isAuth) {
      throw new ForbiddenException(
        'User is not authorized to activate this context.',
      );
    }
    if (roles.length === 0) {
      // console.log('Empty roles array, allowing access');
      return true;
    }
    if (roles.includes('ALL')) {
      // console.log('Role ALL found, allowing access');
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request?.user as User;
    // console.log('User in RoleGuard:', user); // Log thông tin người dùng
    if (!user) throw new BadRequestException('User information is missing.');

    // #2.2.1: Check status user
    if (!user?.isActive)
      throw new UnauthorizedException('User account is locked.');

    // #2.2.2: Check user role
    const userRoleCurrent = user?.role;
    // console.log('User role:', userRoleCurrent, 'Required roles:', roles); // Log vai trò người dùng
    if (
      !userRoleCurrent ||
      (userRoleCurrent && !roles.includes(userRoleCurrent))
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }
    return true;
  }
}
