import { UserRegistrationDto } from './dto/register-user.dto';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validateDto } from 'src/common/utils/validation.util';
import { User } from 'src/entities/user.entity';
import { PasswordService } from 'src/common/services/password.service';
import { Injectable } from '@nestjs/common';
import { UserProfile } from 'src/entities/user-profile.entity';
import { UserService } from '../user/user.service';
import { IResAuth, TPayloadJwt } from './auth.interface';
import * as crypto from 'crypto';
import { jwtConstants } from 'src/configs/auth.config';
import { JwtService } from '@nestjs/jwt';
import { EAccountType, EAccountStatus } from 'src/common/type.common';
import { ERole, generateCode } from 'src/configs/role.config';
import { ForgotPasswordDto } from '../auth/dto/forgot.password.user.dto';
import { MailService } from '../mail/mail.service';
import { MailModule } from '../mail/mail.module';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // date = dayjs(item.date);

  async validUserBeforeLogin(
    username: string,
    password: string,
  ): Promise<User> {
    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      Logger.warn(`Login failed: Username "${username}" not found`);
      throw new BadRequestException({
        message: 'Thông tin đăng nhập không đúng (username)',
      });
    }

    if (!user.isActive) {
      Logger.warn(`Login failed: User "${username}" is inactive`);
      throw new ForbiddenException({
        message: 'Tài khoản của bạn đã bị khóa tạm thời',
      });
    }

    const isCorrectPassword = this.passwordService.comparePassword(
      password,
      user.password,
    );

    if (!isCorrectPassword) {
      Logger.warn(
        `Login failed: Incorrect password for username "${username}"`,
      );
      throw new BadRequestException({
        message: 'Thông tin đăng nhập không đúng (password)',
      });
    }
    return this.userService.findOne(user.id);
  }

  createToken(user: User): IResAuth {
    const payload: TPayloadJwt = {
      id: user.id,
      username: user.username,
    };

    const refreshPayload = {
      ...payload,
      hash: crypto.createHash('md5').update(user.password).digest('hex'),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(refreshPayload, {
        expiresIn: '90d',
        secret: jwtConstants.secret,
      }),
    };
  }

  async Register(
    body: UserRegistrationDto,
    role: ERole = ERole.CUSTOMER,
  ): Promise<User> {
    const validatedDto = await validateDto(body, UserRegistrationDto);
    // check email user
    const existingUser = await this.userService.findOneByEmail(
      validatedDto.email,
    );
    if (existingUser) {
      throw new BadRequestException({
        message: 'Email đã được sử dụng',
      });
    }
    // check username user
    const existingUsername = await this.userService.findOneByUsername(
      validatedDto.username,
    );
    if (existingUsername) {
      throw new BadRequestException({
        message: 'Username đã được sử dụng',
      });
    }
    //check duplicate password
    if (validatedDto.password !== validatedDto.confirmPassword) {
      throw new BadRequestException({
        message: 'Mật khẩu xác nhận không khớp',
      });
    }
    // remove confirmPassword from validatedDto
    delete validatedDto.confirmPassword;

    // Tạo user mới, profile chưa có code
    const newUser = this.userRepository.create({
      ...validatedDto,
      username: validatedDto.username,
      registrationType: EAccountType.REGISTER_YOURSELF,
      status: EAccountStatus.ACTIVE,
      creatorId: null,
      profile: {
        creatorId: null,
      },
    });

    // Lưu user lần đầu để lấy id thực tế
    const savedUser = await this.userRepository.save(newUser);

    // Cập nhật creatorId là chính id vừa tạo
    await this.userRepository.update(savedUser.id, {
      creatorId: savedUser.id,
    });

    // Cập nhật code với id thực tế vào profile
    await this.profileRepository.update(
      { userId: savedUser.id },
      {
        code: generateCode(role, savedUser.id),
        creatorId: savedUser.id,
      },
    );

    return this.userService.findOne(savedUser.id);
  }

  async forgetPassword(body: ForgotPasswordDto): Promise<boolean> {
    const { email } = body;
    const account = await this.userService.findOneByEmail(email);
    if (!account) {
      throw new BadRequestException(`User with email ${email} not found`);
    }
    if (!account.isActive) {
      throw new UnauthorizedException('User account is locked');
    }
    const newPassword = this.passwordService.generateRandomPassword(7);

    const hashedPassword = this.passwordService.hashingPassword(newPassword);
    const result = await this.userRepository.update(account.id, {
      password: hashedPassword,
    });
    this.mailService
      .sendMailer({
        to: account.email,
        subject: 'BE-Ecomerce',
        template: 'forgot-password',
        context: {
          username: account.username,
          newPassword,
          createdAt: new Date(),
        },
      })
      .catch((error) => {
        console.error(
          `Failed to send password reset email to ${account.email}:`,
          error,
        );
      });

    return !!result.affected;
  }

  logout(user: User): Promise<void> {
    Logger.debug(`User ${user.username} logged out`);
    return Promise.resolve();
  }
}
