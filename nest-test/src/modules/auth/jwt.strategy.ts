import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';
import { jwtConstants } from 'src/configs/auth.config';
import { TPayloadJwt } from './auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || jwtConstants.secret,
    });
  }

  async validate(payload: TPayloadJwt) {
    // console.log('JWT Payload:', payload);
    const account = await this.userService.findOne(payload.id);
    // console.log('User found:', user);
    if (!account || !account.isActive) {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc bị khóa.');
    }
    return account;
  }
}
