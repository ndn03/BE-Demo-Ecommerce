import {
  forwardRef,
  Module,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { PasswordService } from 'src/common/services/password.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { ContextMiddleware } from 'src/common/context/context.middleware';
import { MailModule } from '../mail/mail.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule,
    forwardRef(() => UserModule),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtAuthGuard, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes(AuthController);
  }
}
