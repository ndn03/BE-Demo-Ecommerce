import {
  Controller,
  //   Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Get,
  //   NotFoundException,
  //   BadRequestException,
  Query,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
// import { BaseService } from 'src/common/services/base.service';
// import { User } from 'src/entities/user.entity';
import { PasswordService } from 'src/common/services/password.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ERole } from 'src/configs/role.config';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import { UserService } from './user.service';
import { User } from 'src/entities/user.entity';
import { QueryUserDto } from './dto/query.user.dto';
import { CreateUserDto } from './dto/create.user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminChangeEmailDto, changeMyEmailDto } from './dto/change-email.dto';
import {
  UpdateUserHasProfileDto,
  CreateOrUpdateUserProfileDto,
} from './dto/update.user.dto';

@ApiTags('User')
@Controller('v1/user')
export class UserController {
  constructor(
    // private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService, // Thêm service User nếu cần
  ) {}

  @Post('create-user')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Create user` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  async create(@Body() body: CreateUserDto, @AuthUser() user: User) {
    const newUser = await this.userService.Create(body, user);
    delete newUser.password;
    return { message: 'User created successfully', data: newUser };
  }

  @Get('find-all')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Get list user` })
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryUserDto, @AuthUser() user: User) {
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const { data, total } = await this.userService.findAll(query);
    return {
      message: 'Users retrieved successfully',
      data: data,
      total: total,
      limit: query.limit || 10,
      page: query.page || 1,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Get user by id` })
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @HttpCode(HttpStatus.OK)
  async findOne(@Query('id') id: number, @AuthUser() user: User) {
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const foundUser = await this.userService.findOne(id);
    if (!foundUser) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    delete foundUser.password; // Remove password from response for security
    return {
      message: 'User retrieved successfully',
      data: foundUser,
    };
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR, ERole.EMPLOYEE) // Chỉ cần là user đã đăng nhập
  async changePassword(
    @AuthUser() user: User,
    @Body() body: ChangePasswordDto,
  ): Promise<User> {
    return this.userService.changeMyPassword(user.id, user, body);
  }

  @Patch('my/email')
  @HttpCode(HttpStatus.OK)
  @Auth() // Chỉ cần là user đã đăng nhập
  @ApiOperation({ summary: 'Change my own email' })
  async changeMyEmail(@AuthUser() user: User, @Body() body: changeMyEmailDto) {
    const result = await this.userService.changeMyEmail(+user.id, user, body);
    if (!result)
      throw new BadRequestException('Failed to change email for user');
    return { message: `Email changed successfully for user ${user.id}` };
  }

  // @Patch('change-email/user/:id')
  // @HttpCode(HttpStatus.OK)
  // @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES) // Chỉ Admin & HR
  // @ApiOperation({ summary: '[Admin] Change email of a user' })
  // async ChangeEmailDtoForUser(
  //   @Param('id', ParseIntPipe) id: number,
  //   @AuthUser() executor: User,
  //   @Body() body: ChangeEmailDtoForUser, // or ChangeEmailDto | ChangeEmailDtoForUser if needed
  // ) {
  //   await this.userService.changeEmailInternal(id, executor, body);
  //   return {
  //     message: `Email for user with ID ${id} has been changed successfully`,
  //   };
  // }

  @Patch('update-user/:id')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Update user by id` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async updateUserById(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserHasProfileDto,
    @AuthUser() user: User,
  ) {
    const updatedUser = await this.userService.updateUser(id, body, user);
    return {
      message: `User with ID ${id} has been updated successfully`,
      data: updatedUser,
    };
  }

  @Patch('my-profile')
  @ApiOperation({ summary: 'Update my profile' })
  @HttpCode(HttpStatus.OK)
  @Auth()
  async updateMyProfile(
    @AuthUser() user: User,
    @Body() body: CreateOrUpdateUserProfileDto,
  ) {
    const updatedUser = await this.userService.updateUser(user.id, body, user);
    return {
      message: 'My profile has been updated successfully',
      data: updatedUser,
    };
  }
  @Patch(':id/set-password')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Set password user by id` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async setPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ChangePasswordDto,
    @AuthUser() user: User,
  ) {
    const { newPassword, confirmPassword } = body;
    if (newPassword !== confirmPassword)
      throw new BadRequestException(
        'password and confirm password do not match',
      );
    const result = await this.userService.setPassword(+id, newPassword, user);
    if (!result)
      throw new BadRequestException('Failed to set password for user');
    return { message: `Password set successfully for user ${id}` };
  }

  @Delete('soft-delete/:id')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Soft delete user by id` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async softDeleteUser(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    if (user.id === +id)
      //nếu người dùng cố gắng xóa tài khoản của chính mình
      throw new BadRequestException('You cannot soft delete your own account.');
    await this.userService.updateUser(+id, {}, user);
    // Sau đó soft delete
    await this.userService.softDelete(+id);
    return { message: `User with ID ${id} has been soft deleted` };
  }

  @Patch('restore/:id')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Restore user by id` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async restoreUser(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ): Promise<{ message: string }> {
    const softDeleteUser = await this.userService.findOne(+id, true);
    if (!softDeleteUser) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    // Cập nhật editorId trước khi restore
    await this.userService.updateUser(+id, {}, user);

    // Sau đó restore
    await this.userService.restore(+id);
    return { message: `User with ID ${id} has been restored` };
  }

  @Delete(':id')
  @ApiOperation({ summary: `[${ERole.ADMINISTRATOR}] Delete user by id` })
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.ADMINISTRATOR)
  async remove(@Param('id', ParseIntPipe) id: number, @AuthUser() user: User) {
    if (user.id === +id)
      throw new BadRequestException(
        'Bạn không thể xóa tài khoản của chính mình.',
      );
    const result = await this.userService.delete(+id);
    if (!result) throw new BadRequestException('Xóa người dùng thất bại.');
    return { message: 'Xóa người dùng thành công.' };
  }
}
