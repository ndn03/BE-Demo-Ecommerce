import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends (AuthGuard('jwt') as new (
  ...args: any[]
) => any) {}
