import {
  forwardRef,
  Module,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { PasswordService } from 'src/common/services/password.service';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { jwtConstants } from 'src/configs/auth.config';
import { ContextMiddleware } from 'src/common/context/context.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes(UserController);
  }
}
