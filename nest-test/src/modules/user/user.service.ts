import { AdminChangeEmailDto, changeMyEmailDto } from './dto/change-email.dto';
import { CreateUserDto } from './dto/create.user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { validateDto } from 'src/common/utils/validation.util';
import { User } from 'src/entities/user.entity';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  // Logger,
} from '@nestjs/common';
import { UserProfile } from 'src/entities/user-profile.entity';
import { PasswordService } from 'src/common/services/password.service';
import { BaseService } from 'src/common/services/base.service';

import { QueryUserDto } from './dto/query.user.dto';
import { generateCode } from 'src/configs/role.config';
import { EAccountType, EOrder } from 'src/common/type.common';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  UpdateUserDto,
  // UpdateAccountUserDto,
  UpdateUserHasProfileDto,
  CreateOrUpdateUserProfileDto,
} from './dto/update.user.dto';
import { EOrderByUser } from './user.interface';
import { QueryRunner, Repository } from 'typeorm';
// import { EUserCustomStatus } from './user.interface';
@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,

    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {
    super(userRepository);
  }
  async Create(
    body: CreateUserDto,
    user: User,
    registrationType: EAccountType = EAccountType.ACCOUNT_ISSUED,
  ): Promise<User> {
    const validatedDto = await validateDto(body, CreateUserDto);

    const existingUser = await this.findOneByEmail(validatedDto.email);
    if (existingUser) {
      throw new BadRequestException({
        message: 'Email đã được sử dụng',
      });
    }
    const existingUsername = await this.findOneByUsername(
      validatedDto.username,
    );
    if (existingUsername) {
      throw new BadRequestException({
        message: 'Username đã được sử dụng',
      });
    }
    if (validatedDto.password !== validatedDto.confirmPassword) {
      throw new BadRequestException({
        message: 'Mật khẩu xác nhận không khớp',
      });
    }
    delete validatedDto.confirmPassword;

    // Tạo user mới, profile chưa có code
    const newUser = this.userRepository.create({
      ...validatedDto,
      registrationType: registrationType,
      creatorId: user.id,
      isActive: true,
      profile: {
        fullName: validatedDto.fullName,
        workShift: validatedDto.workShift,
        position: validatedDto.position,
        employmentType: validatedDto.employmentType,
      },
    });
    const savedUser = await this.userRepository.save(newUser);

    // Sau khi đã có ID, cập nhật code vào profile
    const code = generateCode(validatedDto.role, savedUser.id);
    await this.profileRepository.update(
      { userId: savedUser.id },
      {
        code,
        creatorId: savedUser.id,
      },
    );
    return this.findOne(savedUser.id);
  }

  async findOne(
    id: number,
    withDeleted: boolean = false,
    relations: string[] = ['profile'],
  ): Promise<User> {
    const qb = this.userRepository.createQueryBuilder('user');
    // Join các relations được truyền vào
    if (relations.includes('profile')) {
      qb.leftJoinAndSelect('user.profile', 'profile');
    }
    //TODO extends join relations

    if (withDeleted) qb.withDeleted();
    qb.addSelect('user.password');
    qb.where('user.id = :id', { id });
    return qb.getOne();
  }

  async findOneByEmail(
    email: string,
    withDeleted: boolean = false,
  ): Promise<User> {
    const qb = this.userRepository.createQueryBuilder('user');
    if (withDeleted) qb.withDeleted();
    qb.addSelect('user.password');
    qb.where('user.email = :email', { email: email.trim().toLowerCase() });
    return qb.getOne();
  }

  async findOneByUsername(
    username: string,
    withDeleted: boolean = false,
  ): Promise<User> {
    if (!username) return null;
    const qb = this.userRepository.createQueryBuilder('user');
    if (withDeleted) qb.withDeleted();
    qb.addSelect('user.password');
    qb.where('user.username = :username', {
      username: username.trim().toLowerCase(),
    });
    return qb.getOne();
  }

  async findAll(query: QueryUserDto): Promise<{ data: User[]; total: number }> {
    const queryDto = await validateDto(query, QueryUserDto);

    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderByUser.ID,
      search,
      isDeleted,
      withDeleted = 0,
      isActive,
      role,
      code,
    } = queryDto;
    const inIds = queryDto?.['inIds[]'];
    const notInIds = queryDto?.['notInIds[]'];

    const qb = this.userRepository.createQueryBuilder('user');

    qb.leftJoinAndSelect('user.profile', 'profile');

    // Search by keyword (username, email, fullName)
    if (search) {
      qb.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR profile.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }
    // Filter by isActive
    if (typeof isActive !== 'undefined') {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }

    if (inIds?.length > 0) {
      qb.andWhere('user.id IN (:...ids)', { ids: inIds });
    }

    if (notInIds?.length > 0) {
      qb.andWhere('user.id NOT IN (:...notInIds)', { notInIds });
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (code) {
      qb.andWhere('profile.code = :code', {
        code: code.trim().toLowerCase(),
      });
    }

    // Filter by deleted status
    if (withDeleted) {
      qb.withDeleted();
      if (typeof isDeleted !== 'undefined') {
        if (isDeleted) {
          qb.andWhere('user.deletedAt IS NOT NULL');
        } else {
          qb.andWhere('user.deletedAt IS NULL');
        }
      }
    }
    // Pagination
    qb.skip((page - 1) * limit).take(limit);
    // Order by
    qb.orderBy(`user.${orderBy}`, order);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
    };
  }
  async changeMyEmail(
    id: number,
    user: User,
    body: changeMyEmailDto,
  ): Promise<User> {
    // Validate ChangeEmailDto
    const validatedDto = await validateDto(body, changeMyEmailDto);
    // Find user by ID
    const account = await this.findOne(id);
    if (!account) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    if (!account.isActive) {
      throw new UnauthorizedException('User account is locked');
    }
    if (account.email === validatedDto.newEmail) {
      throw new BadRequestException(
        'New email must be different from current email',
      );
    }
    if (!body.password) {
      throw new BadRequestException('Password is required to change email');
    }
    if (!body.newEmail || !body.currentEmail) {
      throw new BadRequestException('New email and current email are required');
    }

    if (body.currentEmail !== account.email) {
      throw new BadRequestException('Current email does not match');
    }
    // Check if new email is already in use
    const existingUser = await this.findOneByEmail(validatedDto.newEmail);
    if (existingUser && existingUser.id !== id) {
      throw new BadRequestException('Email is already in use');
    }
    // Update email
    const isCorrectPassword = this.passwordService.comparePassword(
      body.password,
      user.password,
    );
    if (!isCorrectPassword) {
      throw new BadRequestException('Password is incorrect');
    }
    user.email = validatedDto.newEmail;
    // Save the updated user
    return this.userRepository.save(user);
  }

  async changeMyPassword(
    id: number,
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    // Validate ChangePasswordDto
    const validatedDto = await validateDto(
      changePasswordDto,
      ChangePasswordDto,
    );
    // Find user by ID, including password
    const account = await this.findOne(id, true);
    if (!account) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    // Validate current password
    const isMatch = this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }
    const hashedNewPassword = this.passwordService.hashingPassword(
      validatedDto.newPassword,
    );
    user.password = hashedNewPassword;
    // Save the updated user
    return this.userRepository.save(user);
  }

  async setPassword(
    id: number,
    newPassword: string,
    user: User,
  ): Promise<boolean> {
    const account = await this.findOne(id);
    if (!account) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    if (!account.isActive) {
      throw new UnauthorizedException('User account is locked');
    }

    const password = this.passwordService.hashingPassword(newPassword);
    const result = await this.userRepository.update(id, {
      password,
      editorId: user.editorId,
    });
    return !!result.affected;
  }

  async updateUser(
    id: number,
    body: UpdateUserHasProfileDto,
    user: User,
  ): Promise<boolean> {
    const queryRunner: QueryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      // Validate DTOs
      const bodyUpdateUser = await validateDto<UpdateUserDto>(
        body,
        UpdateUserDto,
      );
      const bodyUpdateUserProfile =
        await validateDto<CreateOrUpdateUserProfileDto>(
          body,
          CreateOrUpdateUserProfileDto,
        );
      // Lấy user hiện tại
      const theUser = await queryRunner.manager.findOne(User, {
        where: { id },
        withDeleted: true,
      });
      const oldRole = theUser.role;

      // Cập nhật user
      Object.assign(theUser, bodyUpdateUser, { editorId: user.id });
      await queryRunner.manager.save(theUser);

      // Nếu role thay đổi, cập nhật code trong profile
      if (bodyUpdateUser.role && bodyUpdateUser.role !== oldRole) {
        const code = generateCode(bodyUpdateUser.role, theUser.id);
        await queryRunner.manager.update(
          UserProfile,
          { userId: theUser.id },
          {
            ...bodyUpdateUserProfile,
            code,
            editorId: user.id,
          },
        );
      } else {
        // Nếu không đổi role, chỉ update profile bình thường
        await queryRunner.manager.update(
          UserProfile,
          { userId: theUser.id },
          {
            ...bodyUpdateUserProfile,
            editorId: user.id,
          },
        );
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new BadRequestException(`Failed to update user: ${error}`);
    } finally {
      await queryRunner.release();
    }
  }
}
