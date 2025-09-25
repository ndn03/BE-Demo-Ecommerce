// Core NestJS imports
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// Date handling libraries
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

// Cấu hình dayjs để hỗ trợ timezone
dayjs.extend(utc);
dayjs.extend(timezone);

// Common utilities và base classes
import { BaseService } from '@src/common/services/base.service';
import { validateDto } from '@src/common/utils/validation.util';
import { ETypeDiscount } from '@src/common/type.common';

// Entities
import { VoucherEntity } from '@src/entities/voucher.entity';
import { CategoryEntity } from '@src/entities/categories.entity';
import { BrandsEntity } from '@src/entities/brands.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { User } from '@src/entities/user.entity';

// DTOs
import { CreateVoucherDto } from './dto/create.voucher.dto';
import { checkDuplicateByField } from 'src/common/context/helper/check-field-duplicate';

// Services
import { UserService } from '@src/modules/user/user.service';
import { CategoriesService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { BrandsService } from '../brand/brand.service';
import { CartService } from '../cart/cart.service';

// Interfaces và constants
import { ALLOWED_VOUCHER_DISCOUNTS } from './voucher.interface';
@Injectable()
/**
 * Service xử lý logic nghiệp vụ cho voucher/mã giảm giá
 * Kế thừa từ BaseService để có các phương thức CRUD cơ bản
 */
@Injectable()
export class VoucherService extends BaseService<VoucherEntity> {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(BrandsEntity)
    private readonly brandsRepository: Repository<BrandsEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductsEntity)
    private readonly productsRepository: Repository<ProductsEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly CategoriesService: CategoriesService,
    private readonly BrandsService: BrandsService,
    private readonly ProductService: ProductService,
    private readonly CartService: CartService,
    private readonly UserService: UserService,
  ) {
    super(voucherRepository);
  }

  /**
   * Tạo mới voucher/mã giảm giá
   * @param user - Người dùng tạo voucher (admin/staff)
   * @param data - Dữ liệu voucher từ client
   * @returns Promise<VoucherEntity> - Voucher đã được tạo
   */
  async createVoucher(
    user: User,
    data: CreateVoucherDto,
  ): Promise<VoucherEntity> {
    // Validate dữ liệu đầu vào
    const body = await validateDto(data, CreateVoucherDto);

    // Validate và lấy thương hiệu (nếu có)
    const brandIds = (body.brandsIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    let validatedBrands: BrandsEntity[] = [];
    if (brandIds.length > 0) {
      await this.BrandsService.checkBrandIds(brandIds); // Validate trước
      validatedBrands = await this.brandsRepository.find({
        where: { id: In(brandIds), isActive: true },
      });
      if (validatedBrands.length !== brandIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều thương hiệu không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }
    }

    if (body.code) {
      const isDuplicate = await checkDuplicateByField(
        this.voucherRepository,
        'code',
        body.code,
        {
          idColumn: 'id',
        },
      );

      if (isDuplicate) {
        throw new BadRequestException('Mã giảm giá đã tồn tại!');
      }
    }

    // Validate và lấy danh mục sản phẩm (nếu có)
    const categoryIds = (body.categoriesIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    let validatedCategories: CategoryEntity[] = [];
    if (categoryIds.length > 0) {
      await this.CategoriesService.checkCategoryIds(categoryIds); // Validate trước
      validatedCategories = await this.categoriesRepository.find({
        where: { id: In(categoryIds), isActive: true },
      });
      if (validatedCategories.length !== categoryIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều danh mục không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }
    }

    // Validate và lấy sản phẩm cụ thể (nếu có)
    const productIds = (body.productsIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    let validatedProducts: ProductsEntity[] = [];
    if (productIds.length > 0) {
      await this.ProductService.checkProductIds(productIds); // Validate trước
      validatedProducts = await this.productsRepository.find({
        where: { id: In(productIds), isActive: true },
      });
      if (validatedProducts.length !== productIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều sản phẩm không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }
    }

    // Validate và lấy người dùng có thể sử dụng voucher (nếu có)
    const userIds = (body.userIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    let validatedUsers: User[] = [];
    if (userIds.length > 0) {
      await this.UserService.checkUsersCanInteract(userIds); // Validate trước
      validatedUsers = await this.usersRepository.find({
        where: { id: In(userIds) },
      });
      if (validatedUsers.length !== userIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều người dùng không tồn tại',
        );
      }
    }

    // Validate giá trị giảm giá dựa trên loại giảm giá
    const cart = await this.CartService.getCartByUser(user);
    if (!cart) {
      throw new BadRequestException('Giỏ hàng không tồn tại');
    }

    // Kiểm tra giá trị giảm giá theo từng loại
    if (body.discount_type === ETypeDiscount.PERCENTAGE) {
      // Giảm giá theo phần trăm: 1-100%
      if (body.discount < 1 || body.discount > 100) {
        throw new BadRequestException(
          'Giá trị giảm giá theo phần trăm phải từ 1 đến 100',
        );
      }
    } else if (body.discount_type === ETypeDiscount.AMOUNT) {
      // Giảm giá theo số tiền: phải > 0 và < tổng giá trị giỏ hàng
      if (body.discount <= 0 || body.discount >= cart.totalPrice) {
        throw new BadRequestException(
          'Giá trị giảm giá theo số tiền phải lớn hơn 0 và nhỏ hơn tổng giá trị giỏ hàng',
        );
      }
    } else if (body.discount_type === ETypeDiscount.NO_DISCOUNT) {
      // Không cho phép tạo voucher không giảm giá
      throw new BadRequestException('Loại giảm giá không hợp lệ');
    }

    // Validate các giới hạn sử dụng
    if (body.min_order_value && body.min_order_value < 0) {
      throw new BadRequestException(
        'Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0',
      );
    }

    // Giới hạn tổng số lần sử dụng voucher
    if (
      body.usage_limit !== null &&
      body.usage_limit !== undefined &&
      body.usage_limit < 1
    ) {
      throw new BadRequestException('Giới hạn số lần sử dụng phải lớn hơn 0');
    }

    // Giới hạn số lần sử dụng cho mỗi người dùng
    if (body.per_user_limit !== undefined && body.per_user_limit < 1) {
      throw new BadRequestException(
        'Giới hạn số lần sử dụng cho mỗi người dùng phải lớn hơn 0',
      );
    }
    // Validate và xử lý ngày tháng
    if (body.startDate && body.expirationDate) {
      // Kiểm tra số lần đã sử dụng không được vượt quá giới hạn
      if (
        body.used_count > body.usage_limit ||
        body.used_count === body.usage_limit
      ) {
        throw new BadRequestException('Số lần đã được sử dụng không hợp lệ');
      }

      // Ngày bắt đầu phải trước ngày hết hạn
      if (body.startDate >= body.expirationDate) {
        throw new BadRequestException('Ngày bắt đầu phải trước ngày hết hạn');
      }

      // Ngày hết hạn phải sau thời điểm hiện tại
      if (dayjs(body.expirationDate).isBefore(dayjs())) {
        throw new BadRequestException('Ngày hết hạn phải sau ngày hiện tại');
      }

      // Chuẩn hóa ngày tháng: startDate = đầu ngày, expirationDate = cuối ngày
      const start = dayjs(body.startDate).startOf('day') || null;
      const end = dayjs(body.expirationDate).endOf('day');
      body.startDate = start.toDate();
      body.expirationDate = end.toDate();
    } else {
      throw new BadRequestException('Vui lòng cung cấp ngày hết hạn');
    }

    // Tạo voucher entity mới
    const newVoucher = this.voucherRepository.create({
      code: body.code,
      discount: body.discount,
      description: body.description,
      discount_type: ALLOWED_VOUCHER_DISCOUNTS.includes(body.discount_type)
        ? body.discount_type
        : ETypeDiscount.NO_DISCOUNT,
      startDate: body.startDate,
      expirationDate: body.expirationDate,
      min_order_value: body.min_order_value,
      usage_limit: body.usage_limit,
      used_count: body.used_count || 0,
      per_user_limit: body.per_user_limit,
      status: body.status,
      applicableRoles: body.applicableRoles,
      creatorId: user.id,
    });

    // Lưu voucher cơ bản trước
    const savedVoucher = await this.voucherRepository.save(newVoucher);

    // Gán relationships sử dụng entities đã validated
    if (validatedBrands.length > 0) {
      savedVoucher.brandsIds = validatedBrands;
    }

    if (validatedCategories.length > 0) {
      savedVoucher.categoriesIds = validatedCategories;
    }

    if (validatedProducts.length > 0) {
      savedVoucher.productsIds = validatedProducts;
    }

    if (validatedUsers.length > 0) {
      savedVoucher.userIds = validatedUsers;
    }

    // Lưu lại voucher với tất cả relationships
    const finalVoucher = await this.voucherRepository.save(savedVoucher);

    // Query lại để có đầy đủ relationships cho response
    const voucherWithRelations = await this.voucherRepository.findOne({
      where: { id: finalVoucher.id },
      relations: ['brandsIds', 'categoriesIds', 'productsIds', 'userIds'],
    });

    // Transform response để chỉ trả về IDs thay vì full entities
    return {
      ...voucherWithRelations,
      brandsIds: voucherWithRelations.brandsIds?.map((brand) => brand.id) || [],
      categoriesIds:
        voucherWithRelations.categoriesIds?.map((category) => category.id) ||
        [],
      productsIds:
        voucherWithRelations.productsIds?.map((product) => product.id) || [],
      userIds: voucherWithRelations.userIds?.map((user) => user.id) || [],
    } as any;
  }
}
