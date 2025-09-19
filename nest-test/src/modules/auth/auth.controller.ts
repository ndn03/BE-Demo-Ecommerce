import { UserRegistrationDto } from './dto/register-user.dto';
import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
// import { User } from 'src/entities/user.entity';
import { PasswordService } from 'src/common/services/password.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { ERole } from 'src/configs/role.config';
import { AuthService } from './auth.service';
// import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { Auth, AuthUser } from './auth.decorator';
import { User } from 'src/entities/user.entity';
import { ForgotPasswordDto } from '../auth/dto/forgot.password.user.dto';
@ApiTags('Auth')
@Controller('v1/user')
export class AuthController {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: `Register user` })
  async create(@Body() body: UserRegistrationDto) {
    const newUser = await this.authService.Register(body);
    delete newUser?.password; // Remove password from response for security
    return {
      message: `Registration successfully with username ${newUser.username}`,
      data: newUser,
    };
  }

  @Post('login')
  @ApiOperation({ summary: `Login user` })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validUserBeforeLogin(
      body.username,
      body.password,
    );
    const tokens = this.authService.createToken(user);

    return {
      message: `Login successfully with username ${user.username} with employee code ${user.profile?.code}`,
      data: tokens,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOperation({ summary: `Refresh token user` })
  refreshToken(@AuthUser() user: User) {
    const tokens = this.authService.createToken(user);
    return {
      message: `Refresh token successfully for user ${user.username}`,
      data: tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOperation({ summary: `Logout user` })
  logout(@AuthUser() user: User) {
    return {
      message: `Logout successfully for user ${user.username}`,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi mật khẩu mới tới email người dùng' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const success = await this.authService.forgetPassword(body);
    return {
      message: success
        ? 'Mật khẩu mới đã được gửi tới email của bạn'
        : 'Không thể xử lý yêu cầu',
      success,
    };
  }
}
