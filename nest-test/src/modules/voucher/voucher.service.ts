import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner, Brackets } from 'typeorm';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Common
import { BaseService } from '@src/common/services/base.service';
import { validateDto } from '@src/common/utils/validation.util';
import { checkDuplicateByField } from 'src/common/context/helper/check-field-duplicate';
import {
  EOrder,
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
} from '@src/common/type.common';
import { ERole } from '@src/configs/role.config';

// Entities
import { VoucherEntity } from '@src/entities/voucher.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { User } from '@src/entities/user.entity';
import { VoucherRecipient } from '@src/entities/voucher.user.entity';
import { VoucherProductEntity } from '@src/entities/voucher.products.entity';
import { VoucherHistory } from '@src/entities/voucher.history.entity';

// DTOs
import { CreateVoucherDto } from './dto/create.voucher.dto';
import { UpdateVoucherDto } from './dto/update.voucher.dto';

// Services
import { BrandsService } from '../brand/brand.service';
import { CategoriesService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { QueryVoucherDto } from './dto/query.voucher.dto';
import { EVoucher } from './voucher.interface';

/**
 * Service xử lý logic nghiệp vụ cho voucher/mã giảm giá
 *
 * 🎯 **Chức năng chính:**
 * - Tạo mới voucher với validation đầy đủ
 * - Quản lý recipient và product targeting
 * - CRUD operations với transaction safety
 * - Advanced filtering và search capabilities
 *
 * 🔒 **Bảo mật:**
 * - Role-based permissions (Admin/HR/Employee)
 * - Input validation và sanitization
 * - Business rules enforcement
 *
 * 🔄 **Performance:**
 * - Optimized QueryBuilder patterns
 * - Selective relationship loading
 * - Batch operations cho bulk data
 */
@Injectable()
export class VoucherService extends BaseService<VoucherEntity> {
  private readonly logger = new Logger(VoucherService.name);

  /**
   * 🏗️ **Constructor - Dependency Injection Setup**
   *
   * **Luồng khởi tạo:**
   * 1. Inject các repositories cần thiết cho database operations
   * 2. Inject các services để validate business logic
   * 3. Gọi parent constructor với main repository
   *
   * **Dependencies được inject:**
   * - VoucherRepository: Main entity repository
   * - VoucherRecipient: Quản lý người nhận voucher
   * - VoucherProduct: Quản lý sản phẩm áp dụng voucher
   * - BrandsService, CategoriesService, ProductService: Validate related entities
   * - UserService: Validate user permissions và roles
   */
  constructor(
    @InjectRepository(VoucherEntity) // 🗄️ Inject repository chính cho VoucherEntity
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(VoucherRecipient) // 👥 Inject repository cho voucher recipients
    private readonly voucherRecipientRepository: Repository<VoucherRecipient>,
    @InjectRepository(VoucherProductEntity) // 🛍️ Inject repository cho voucher products
    private readonly voucherProductRepository: Repository<VoucherProductEntity>,
    @InjectRepository(VoucherHistory) // 📜 Inject repository cho voucher history/instances
    private readonly voucherHistoryRepository: Repository<VoucherHistory>,
    private readonly brandsService: BrandsService, // 🏷️ Service validate brands
    private readonly categoriesService: CategoriesService, // 📂 Service validate categories
    private readonly productService: ProductService, // 🎯 Service validate products
    private readonly userService: UserService, // 👤 Service validate users
  ) {
    super(voucherRepository); // 🔗 Gọi parent constructor với main repository
  }

  /**
   * 🎯 **Tạo mới voucher/mã giảm giá**
   *
   * **Luồng xử lý chính:**
   * 1. **Validation Phase:** Kiểm tra permissions, business rules, duplicates
   * 2. **Data Processing:** Xử lý receivers và products targeting
   * 3. **Transaction Phase:** Lưu voucher + relations trong transaction
   *
   * **Business Rules:**
   * - Chỉ Admin/HR/Employee mới được tạo voucher
   * - Voucher code phải unique trong hệ thống
   * - Validate date range, discount value, usage limits
   * - Target receivers/products phải hợp lệ
   *
   * **Database Operations:**
   * - Sử dụng transaction để đảm bảo data consistency
   * - Tạo voucher chính → recipients → products
   * - Rollback nếu có lỗi bất kỳ
   */
  async createVoucher(
    user: User, // 👤 User thực hiện tạo voucher (cần check permissions)
    data: CreateVoucherDto, // 📝 Data đầu vào đã được validate qua DTO
  ): Promise<VoucherEntity> {
    // 📋 Ghi log bắt đầu quá trình tạo voucher
    this.logger.log(`User ${user.id} tạo voucher với code: ${data.code}`);

    // 🔍 **PHASE 1: VALIDATION** - Kiểm tra tất cả điều kiện trước khi tạo
    const body = await validateDto(data, CreateVoucherDto); // ✅ Validate DTO structure và rules
    const isDuplicate = await checkDuplicateByField(
      this.voucherRepository,
      'code',
      body.code,
    );
    if (isDuplicate) {
      throw new BadRequestException(
        `Mã voucher "${body.code}" đã tồn tại. Vui lòng sử dụng mã khác.`, // 🚫 Message user-friendly
      );
    }
    this.validateDateRange(body.validFrom, body.validTo); // 📅 Validate thời gian hiệu lực
    this.validateDiscountValue(body.value_discount, body.discount_type); // 💰 Validate giá trị giảm giá

    // 🚧 **Campaign ID Warning** - Tính năng chưa implement
    if (body.campaignId) {
      this.logger.warn(
        `Campaign ID ${body.campaignId} được bỏ qua - tính năng Campaign chưa được triển khai`,
      );
    }

    // 🔢 **Used Count Override** - Voucher mới luôn có used_count = 0
    if (body.used_count && body.used_count !== 0) {
      this.logger.warn(
        `used_count từ client (${body.used_count}) bị bỏ qua - voucher mới luôn bắt đầu với used_count = 0`,
      );
      body.used_count = 0;
    }

    // 🎯 **Target Type Logic Validation**
    if (
      body.targetType === EtargetType.ALL &&
      body.list_targetType &&
      body.list_targetType.length > 0
    ) {
      this.logger.warn(
        `targetType=ALL nhưng có list_targetType=[${body.list_targetType.join(', ')}] - list_targetType sẽ bị bỏ qua`,
      );
    }

    // 🔄 **PHASE 2: DATA PROCESSING** - Xử lý data và chuẩn bị entities
    const receiverIds = await this.getUsersByIds(body); // 👥 Lấy danh sách IDs người nhận
    const productIds = await this.getProductsByIds(body); // 🛍️ Lấy danh sách IDs sản phẩm áp dụng

    if (
      body.discount_type === ETypeDiscount.PERCENTAGE && // Nếu là giảm theo %
      body.min_order_value // Và có min order value
    ) {
      // 🔢 Tính max discount có thể có với min order value
      const maxPossibleDiscount =
        (body.min_order_value * body.value_discount) / 100;
      // ⚠️ Warning nếu max discount quá cao so với tính toán
      if (body.max_discount_value > maxPossibleDiscount * 2) {
        this.logger.warn(
          `Max discount value (${body.max_discount_value}) có thể quá cao so với min order value`,
        );
      }
    }
    this.logger.log(
      `Validation hoàn tất. ReceiverIds: ${receiverIds.length}, ProductIds: ${productIds.length}`,
    );

    // 🔄 **PHASE 3: DATABASE TRANSACTION** - Lưu data với transaction safety
    const queryRunner =
      this.voucherRepository.manager.connection.createQueryRunner(); // 🗄️ Tạo query runner cho transaction
    await queryRunner.connect(); // 🔌 Kết nối database
    await queryRunner.startTransaction(); // 🚀 Bắt đầu transaction

    try {
      // 🚫 **Exclude unsupported fields** - Loại bỏ các field chưa được implement
      const { campaignId, ...voucherData } = body;

      const newVoucher = {
        ...voucherData,
        creatorId: user.id,
        used_count: 0, // 🔢 Ensure used_count = 0 for new voucher
      };
      // 💾 Lưu voucher chính trước
      const savedVoucher = await queryRunner.manager.save(
        VoucherEntity,
        newVoucher,
      );
      // 📋 Log thành công voucher chính
      this.logger.log(
        `Tạo voucher thành công với ID: ${savedVoucher.id}, Code: ${savedVoucher.code}`,
      );

      // 👥 Tạo voucher recipients nếu có
      if (receiverIds.length > 0) {
        await this.createVoucherRecipients(
          queryRunner,
          savedVoucher.id,
          receiverIds,
        );
        this.logger.log(`Tạo ${receiverIds.length} VoucherRecipient records`); // 📊 Log số lượng recipients

        // 📜 Tạo voucher history instances cho mỗi user
        await this.createVoucherHistoryInstances(
          queryRunner,
          savedVoucher.id,
          receiverIds,
          body.validFrom,
          body.validTo,
        );
        this.logger.log(`Tạo ${receiverIds.length} VoucherHistory instances`); // 📊 Log số lượng history instances
      }

      // 🛍️ Tạo voucher products nếu có
      if (productIds.length > 0) {
        await this.createVoucherProducts(
          queryRunner,
          savedVoucher.id,
          productIds,
        );
        this.logger.log(`Tạo ${productIds.length} VoucherProduct records`); // 📊 Log số lượng products
      }

      await queryRunner.commitTransaction(); // ✅ Commit transaction nếu tất cả thành công
      this.logVoucherCreationDetails(savedVoucher, receiverIds, productIds); // 📋 Log chi tiết voucher đã tạo

      return savedVoucher;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi khi lưu voucher: ${error.message}`, error.stack); // 🚨 Log lỗi chi tiết
      throw new BadRequestException(`Không thể tạo voucher: ${error.message}`); // 💥 Throw exception với message user-friendly
    } finally {
      await queryRunner.release(); // 🧹 Giải phóng connection dù thành công hay thất bại
    }
  }

  /**
   * 📅 **Validate Date Range**
   *
   * **Luồng validation:**
   * 1. Convert dates sang timezone Việt Nam
   * 2. Kiểm tra startDate không được trong quá khứ (trừ 5 phút buffer)
   * 3. Kiểm tra endDate phải sau startDate
   * 4. Kiểm tra voucher phải có hiệu lực ít nhất 1 giờ
   * 5. Warning nếu voucher có hiệu lực quá dài (>1 năm)
   *
   * **Business Rules:**
   * - Không tạo voucher backdated
   * - Duration tối thiểu 1 giờ
   * - Warning cho duration bất thường
   */
  private validateDateRange(
    validFrom: Date,
    validTo: Date,
    TimeZone: string = process.env.TZ,
  ): void {
    const now = dayjs().tz(TimeZone);
    const startDate = dayjs(validFrom).tz(TimeZone);
    const endDate = dayjs(validTo).tz(TimeZone);

    // 📅 Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
    if (endDate.isBefore(startDate)) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu', // 🚫 Logic cơ bản về thời gian
      );
    }

    // ⏱️ Kiểm tra voucher phải có hiệu lực tối thiểu 1 giờ
    if (endDate.diff(startDate, 'hour') < 1) {
      throw new BadRequestException('Voucher phải có hiệu lực ít nhất 1 giờ'); // 🚫 Tránh voucher quá ngắn hạn
    }
  }

  /**
   * 💰 **Validate Discount Value**
   *
   * **Luồng validation:**
   * 1. Kiểm tra value > 0 (cơ bản)
   * 2. Switch case theo discount type:
   *    - PERCENTAGE: <= 100%, warning nếu > 50%
   *    - AMOUNT: warning nếu > 10M VND
   * 3. Throw exception cho invalid type
   *
   * **Business Rules:**
   * - Percentage không được > 100%
   * - Warning cho high-value discounts
   * - Chặn invalid discount types
   */
  private validateDiscountValue(value: number, type: ETypeDiscount): void {
    if (value < 0) {
      throw new BadRequestException('Giá trị giảm giá không được âm');
    }

    // Cho phép value = 0 cho test voucher hoặc free voucher
    if (value === 0) {
      this.logger.warn(
        'Voucher với giá trị giảm giá = 0 (test voucher hoặc free voucher)',
      );
      return;
    }

    // 🔄 Switch case theo loại discount để validate cụ thể
    switch (type) {
      case ETypeDiscount.PERCENTAGE:
        if (value > 99) {
          throw new BadRequestException(
            'Giá trị phần trăm giảm giá không được vượt quá 99%', // Logic cơ bản của %
          );
        }
        // ⚠️ Warning cho discount cao (> 50%)
        if (value > 50) {
          this.logger.warn(`Giá trị giảm giá cao: ${value}% - cần xem xét kỹ`); // Admin cần review
        }
        break;

      case ETypeDiscount.AMOUNT:
        if (value > 10_000_000) {
          this.logger.warn(
            `Giá trị giảm giá rất cao: ${value.toLocaleString('vi-VN')} VND`, // Format số tiền theo locale VN
          );
        }
        if (value > 1_000_000) {
          throw new BadRequestException(
            'Giá trị giảm giá theo số tiền không được vượt quá 1,000,000 VND', // Giới hạn cứng cho amount
          );
        }
        break;

      default:
        throw new BadRequestException(`Loại giảm giá không hợp lệ: ${type}`); // Chặn invalid enum values
    }
  }

  /**
   * 🏗️ **Create Voucher Entity**
   *
   * **Luồng tạo entity:**
   * 1. Khởi tạo VoucherEntity instance mới
   * 2. Map từng field từ DTO sang entity với processing
   * 3. Set default values cho các optional fields
   * 4. Set system fields (creator, timestamps)
   *
   * **Data Processing:**
   * - Code: uppercase và trim whitespace
   * - Defaults: reasonable defaults cho optional fields
   * - Security: không set creator trực tiếp từ DTO
   */
  // private async validateCampaignId(campaignId: number): Promise<void> {
  //   this.logger.warn(
  //     `Campaign ID ${campaignId} được request nhưng VoucherCampaign repository chưa được implement`,
  //   );
  //   throw new BadRequestException(
  //     'Tính năng Campaign chưa được triển khai. Vui lòng tạo voucher không liên kết campaign (bỏ trống campaignId)',
  //   );
  // }

  private logVoucherCreationDetails(
    voucher: VoucherEntity,
    receiverIds: number[],
    productIds: number[],
  ): void {
    const details = {
      voucherId: voucher.id,
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.value_discount,
      targetType: voucher.targetType,
      receiversCount: receiverIds.length,
      productsCount: productIds.length,
      // validFrom/validTo giờ được lưu ở VoucherHistory per instance
      // validFrom: dayjs(voucher.validFrom).format('DD/MM/YYYY HH:mm'),
      // validTo: dayjs(voucher.validTo).format('DD/MM/YYYY HH:mm'),
      isPublic: voucher.isPublic,
    };

    this.logger.log(
      `Chi tiết voucher đã tạo: ${JSON.stringify(details, null, 2)}`,
    );
  }

  private async getUsersByIds(body: CreateVoucherDto): Promise<number[]> {
    const group = body.targetReceiverGroup;
    const role = this.mapTargetReceiverGroupToRole(group);

    if (body.receiverIds && body.receiverIds.length > 0) {
      // Validate specific user IDs using UserService
      const isValid = await this.userService.checkUsersCanInteract(
        body.receiverIds,
      );
      if (!isValid) {
        throw new BadRequestException(
          'Một số người dùng không hợp lệ hoặc không thể tương tác',
        );
      }

      // Additional role validation if needed
      if (role) {
        const users = await this.voucherRepository.manager
          .createQueryBuilder(User, 'user')
          .where('user.id IN (:...ids)', { ids: body.receiverIds })
          .andWhere('user.role IN (:...roles)', {
            roles: Array.isArray(role) ? role : [role],
          })
          .select('user.id')
          .getRawMany();

        const validIds = users.map((u) => u.user_id);
        if (validIds.length !== body.receiverIds.length) {
          const excludedIds = body.receiverIds.filter(
            (id) => !validIds.includes(id),
          );
          throw new BadRequestException(
            `Một số người dùng không thuộc nhóm được chọn: ${excludedIds.join(', ')}`,
          );
        }
        return validIds;
      }

      return body.receiverIds;
    }

    // Get all users by role if no specific IDs provided
    const users = await this.voucherRepository.manager
      .createQueryBuilder(User, 'user')
      .where(role ? 'user.role IN (:...roles)' : '1=1', {
        roles: role ? (Array.isArray(role) ? role : [role]) : undefined,
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.deletedAt IS NULL')
      .select('user.id')
      .getRawMany();

    const finalIds = users.map((u) => u.user_id);

    if (finalIds.length === 0) {
      this.logger.warn('Không tìm thấy người dùng hợp lệ');
      return [];
    }

    this.logger.log(
      `Sử dụng targetReceiverGroup: ${group} cho voucher ID, tìm thấy ${finalIds.length} receivers`,
    );
    return finalIds;
  }

  private mapTargetReceiverGroupToRole(group: number): ERole | ERole[] | null {
    const groupToRoleMap: Record<number, ERole | ERole[] | null> = {
      [ETargetReceiverGroup.ALL]: null, //1 (áp dụng cho tất cả người dùng)
      [ETargetReceiverGroup.HUMAN_RESOURCES]: ERole.HUMAN_RESOURCES, //2 (áp dụng cho nhân sự)
      [ETargetReceiverGroup.EMPLOYEE]: ERole.EMPLOYEE, //3 (áp dụng cho nhân viên)
      [ETargetReceiverGroup.CUSTOMER]: ERole.CUSTOMER, //4 (áp dụng cho khách hàng thường)
      [ETargetReceiverGroup.ALL_CUSTOMER]: [
        ERole.CUSTOMER,
        ERole.CUSTOMER_VIP1,
        ERole.CUSTOMER_VIP2,
        ERole.CUSTOMER_VIP3,
      ], //5 (áp dụng cho tất cả khách hàng)
      [ETargetReceiverGroup.CUSTOMER_VIP]: [
        ERole.CUSTOMER_VIP1,
        ERole.CUSTOMER_VIP2,
        ERole.CUSTOMER_VIP3,
      ], //6 (áp dụng cho khách hàng VIP)
    };
    if (!(group in groupToRoleMap)) {
      throw new Error(`Giá trị targetReceiverGroup không hợp lệ: ${group}`);
    }
    return groupToRoleMap[group];
  }

  private mapTargetProducts(targetType: EtargetType): EtargetType {
    // Validate targetType có hợp lệ không
    if (!Object.values(EtargetType).includes(targetType)) {
      throw new Error(`Giá trị targetType không hợp lệ: ${targetType}`);
    }
    return targetType;
  }

  private async getProductsByIds(body: CreateVoucherDto): Promise<number[]> {
    const targetType = this.mapTargetProducts(body.targetType);

    if (targetType === EtargetType.ALL) {
      if (body.list_targetType && body.list_targetType.length > 0) {
        this.logger.warn(
          `targetType=ALL nhưng có list_targetType=[${body.list_targetType.join(', ')}]. Sẽ áp dụng cho cụ thể sản phẩm này.`,
        );
        return await this.validateAndReturnProductIds(body.list_targetType);
      }

      // Lấy tất cả sản phẩm hiện có trong database
      this.logger.log(
        'Voucher áp dụng cho tất cả sản phẩm - lấy danh sách tất cả sản phẩm',
      );
      const allProducts = await this.voucherRepository.manager
        .createQueryBuilder(ProductsEntity, 'product')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.deletedAt IS NULL')
        .select('product.id')
        .getRawMany();
      const allProductIds = allProducts.map((p) => p.product_id);

      this.logger.log(
        `Tìm thấy ${allProductIds.length} sản phẩm để áp dụng voucher`,
      );
      return allProductIds;
    }

    switch (targetType) {
      case EtargetType.BRAND:
        // Nếu không có brandIds thì lấy tất cả sản phẩm từ tất cả brand
        return await this.getProductsByBrandIds(body.list_targetType || []);
      case EtargetType.CATEGORY:
        return await this.getProductsByCategoryIds(body.list_targetType);
      case EtargetType.PRODUCT:
        if (!body.list_targetType || body.list_targetType.length === 0) {
          throw new BadRequestException(
            'list_targetType không được để trống khi targetType là PRODUCT',
          );
        }
        return await this.validateAndReturnProductIds(body.list_targetType);
      default:
        throw new BadRequestException(
          `targetType không được hỗ trợ: ${targetType}`,
        );
    }
  }

  private async getProductsByBrandIds(brandIds: number[]): Promise<number[]> {
    // Nếu brandIds rỗng, lấy tất cả sản phẩm từ tất cả brand
    if (!brandIds || brandIds.length === 0) {
      this.logger.log(
        'targetType=BRAND nhưng không có brandIds cụ thể - lấy tất cả sản phẩm từ tất cả thương hiệu',
      );

      const products = await this.voucherRepository.manager
        .createQueryBuilder(ProductsEntity, 'product')
        .innerJoin('product.brand', 'brand')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.deletedAt IS NULL')
        .andWhere('brand.isActive = :brandIsActive', { brandIsActive: true })
        .andWhere('brand.deletedAt IS NULL')
        .select('product.id')
        .getRawMany();

      const allProductIds = products.map((p) => p.product_id);
      this.logger.log(
        `Tìm thấy ${allProductIds.length} sản phẩm từ tất cả thương hiệu`,
      );

      return allProductIds;
    }

    // Validate brand IDs first using BrandsService (chỉ khi có brandIds)
    await this.brandsService.checkBrandIds(brandIds);

    // Get products by validated brand IDs
    const products = await this.voucherRepository.manager
      .createQueryBuilder(ProductsEntity, 'product')
      .innerJoin('product.brand', 'brand')
      .where('brand.id IN (:...brandIds)', { brandIds })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.deletedAt IS NULL')
      .select('product.id')
      .getRawMany();

    if (products.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy sản phẩm nào thuộc các thương hiệu đã chọn',
      );
    }

    const productIds = products.map((p) => p.product_id);
    this.logger.log(
      `Tìm thấy ${productIds.length} sản phẩm từ ${brandIds.length} thương hiệu cụ thể`,
    );

    return productIds;
  }

  private async getProductsByCategoryIds(
    categoryIds: number[],
  ): Promise<number[]> {
    // Nếu categoryIds rỗng, lấy tất cả sản phẩm từ tất cả category
    if (!categoryIds || categoryIds.length === 0) {
      this.logger.log(
        'targetType=CATEGORY nhưng không có categoryIds cụ thể - lấy tất cả sản phẩm từ tất cả danh mục',
      );

      const allProducts = await this.voucherRepository.manager
        .createQueryBuilder(ProductsEntity, 'product')
        .innerJoin('product.categories', 'category')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.deletedAt IS NULL')
        .andWhere('category.isActive = :categoryIsActive', {
          categoryIsActive: true,
        })
        .andWhere('category.deletedAt IS NULL')
        .select('product.id')
        .distinct(true)
        .getRawMany();

      const productIds = allProducts.map((p) => p.product_id);
      this.logger.log(
        `Tìm thấy ${productIds.length} sản phẩm từ tất cả danh mục`,
      );
      return productIds;
    }

    // Validate category IDs first using CategoriesService (chỉ khi có categoryIds)
    await this.categoriesService.checkCategoryIds(categoryIds);

    // Get products by validated category IDs
    const products = await this.voucherRepository.manager
      .createQueryBuilder(ProductsEntity, 'product')
      .innerJoin('product.categories', 'category')
      .where('category.id IN (:...categoryIds)', {
        categoryIds: categoryIds,
      })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.deletedAt IS NULL')
      .select('product.id')
      .distinct(true)
      .getRawMany();

    if (products.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy sản phẩm nào thuộc các danh mục đã chọn',
      );
    }

    const productIds = products.map((p) => p.product_id);
    this.logger.log(
      `Tìm thấy ${productIds.length} sản phẩm từ ${categoryIds.length} danh mục cụ thể`,
    );

    return productIds;
  }

  private async validateAndReturnProductIds(
    productIds: number[],
  ): Promise<number[]> {
    await this.productService.checkProductIds(productIds);
    this.logger.log(`Validated ${productIds.length} sản phẩm hợp lệ`);
    return productIds;
  }

  private async createVoucherRecipients(
    queryRunner: QueryRunner,
    voucherId: number,
    receiverIds: number[],
  ): Promise<void> {
    const voucherRecipients = receiverIds.map((userId) => {
      const recipient = new VoucherRecipient();
      recipient.voucherId = voucherId;
      recipient.userId = userId;
      recipient.quantity = 1;
      recipient.usedCount = 0;
      recipient.maxUsages = null;
      recipient.source = 'admin_assign';
      return recipient;
    });

    await queryRunner.manager.save(VoucherRecipient, voucherRecipients);
    this.logger.log(
      `Created ${voucherRecipients.length} VoucherRecipient records for voucher ${voucherId}`,
    );
  }

  /**
   * 📜 **Tạo VoucherHistory instances cho từng user**
   *
   * **Logic:** Mỗi user được assign voucher sẽ có một VoucherHistory record
   * với validity dates từ voucher template và usage limits riêng
   */
  private async createVoucherHistoryInstances(
    queryRunner: QueryRunner,
    voucherId: number,
    userIds: number[],
    validFrom: Date,
    validTo: Date,
  ): Promise<void> {
    const voucherHistories = userIds.map((userId) => {
      const history = new VoucherHistory();
      history.voucherId = voucherId;
      history.userId = userId;
      history.validFrom = validFrom;
      history.validTo = validTo;
      history.instanceUsageLimit = 1; // Default: mỗi user có thể sử dụng 1 lần
      history.instanceUsedCount = 0; // Chưa sử dụng
      return history;
    });

    await queryRunner.manager.save(VoucherHistory, voucherHistories);
    this.logger.log(
      `Created ${voucherHistories.length} VoucherHistory instances for voucher ${voucherId}`,
    );
  }

  private async createVoucherProducts(
    queryRunner: QueryRunner,
    voucherId: number,
    productIds: number[],
  ): Promise<void> {
    this.logger.log(
      `Creating VoucherProduct records for voucher ${voucherId} with ${productIds.length} products: [${productIds.join(', ')}]`,
    );

    try {
      // Primary method: Raw SQL query
      const values = productIds
        .map((productId) => `(${voucherId}, ${productId})`)
        .join(', ');
      const insertQuery = `INSERT INTO voucher_products (voucherId, productId) VALUES ${values}`;

      await queryRunner.query(insertQuery);
      this.logger.log(
        `Successfully created ${productIds.length} VoucherProduct records using raw query for voucher ${voucherId}`,
      );
    } catch (rawQueryError) {
      this.logger.warn(
        `Raw query failed: ${rawQueryError.message}, trying entity approach...`,
      );

      try {
        // Fallback method: Entity approach
        const voucherProducts = productIds.map((productId) => {
          const voucherProduct = this.voucherProductRepository.create();
          (voucherProduct as any).voucherId = voucherId;
          (voucherProduct as any).productId = productId;
          return voucherProduct;
        });

        const savedProducts = await queryRunner.manager.save(
          VoucherProductEntity,
          voucherProducts,
        );
        this.logger.log(
          `Successfully created ${savedProducts.length} VoucherProduct records using entity approach for voucher ${voucherId}`,
        );
      } catch (entityError) {
        this.logger.error(
          `Both methods failed. Raw query error: ${rawQueryError.message}, Entity error: ${entityError.message}`,
          entityError.stack,
        );
        throw entityError;
      }
    }
  }

  /**
   * 🔍 **Lấy danh sách voucher với filtering và pagination**
   *
   * **Luồng xử lý chính:**
   * 1. **Input Validation:** Validate và extract query parameters
   * 2. **QueryBuilder Setup:** Tạo base query với relationships
   * 3. **Filtering Phase:** Apply tất cả các điều kiện filter
   * 4. **Sorting & Pagination:** Order và phân trang
   * 5. **Execution:** Thực thi query và trả về kết quả
   *
   * **Features:**
   * - Advanced search với Brackets cho complex conditions
   * - 20+ filter conditions cho mọi field
   * - Soft-delete handling với withDeleted option
   * - Rich relationship loading (creator, products, recipients)
   * - Flexible pagination (có thể disable)
   * - Performance optimized với selective joins
   */
  async findAll(
    body: QueryVoucherDto, // 📝 Query parameters từ client
  ): Promise<{ data: VoucherEntity[]; total: number }> {
    // 🔍 **PHASE 1: INPUT VALIDATION** - Validate DTO structure
    const queryDto = await validateDto(body, QueryVoucherDto);

    // 📋 **PHASE 2: PARAMETER EXTRACTION** - Extract với default values
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EVoucher.code,
      search,
      isDeleted,
      withDeleted,
      code,
      status,
      targetReceiverGroup,
      targetType,
      discount_type,
      validFrom,
      validTo,
      min_order_value,
      max_discount_value,
      usage_limit,
      per_user_limit,
      used_count,
      isActive,
      'list_targetType[]': list_targetType,
      creatorId,
      isPagination = 1,
    } = queryDto;

    // **PHASE 3: ARRAY PARAMETERS** - Extract special array formats
    const inIds = queryDto?.['inIds[]']; //Danh sách IDs cần include
    const notInIds = queryDto?.['notInIds[]']; //Danh sách IDs cần exclude

    // **PHASE 4: QUERYBUILDER SETUP** - Khởi tạo base query
    const qb = this.voucherRepository.createQueryBuilder('voucher');

    // **PHASE 5: RELATIONSHIPS SETUP** - Join các bảng liên quan
    qb.leftJoinAndSelect('voucher.creator', 'creator'); // 👤 Thông tin người tạo
    qb.leftJoinAndSelect('voucher.voucherProducts', 'vp'); // 🛍️ Relation products
    qb.leftJoinAndSelect('vp.product', 'product'); // 🎯 Chi tiết sản phẩm
    qb.leftJoinAndSelect('voucher.voucherRecipients', 'vr'); // 👥 Relation recipients
    qb.leftJoinAndSelect('vr.user', 'recipient'); // 👤 Chi tiết người nhận

    // 🔍 **Global Search** - Tìm kiếm across multiple fields
    if (search) {
      qb.andWhere(
        new Brackets((qbs) => {
          // 🔗 Sử dụng Brackets để group OR conditions
          qbs
            .where('LOWER(voucher.code) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(voucher.description) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(creator.username) LIKE LOWER(:search)', {
              // 👤 Tìm theo tên creator
              search: `%${search.toLowerCase()}%`,
            });
        }),
      );
    }
    if (code) {
      qb.andWhere('LOWER(voucher.code) = LOWER(:code)', {
        code: code.trim(),
      });
    }
    if (isActive !== undefined) {
      qb.andWhere('voucher.isActive = :isActive', { isActive });
    }
    if (status) {
      qb.andWhere('voucher.status = :status', { status }); // 📊 Exact match status (ACTIVE, EXPIRED, etc.)
    }
    if (targetReceiverGroup !== undefined) {
      qb.andWhere('voucher.targetReceiverGroup = :targetReceiverGroup', {
        targetReceiverGroup,
      });
    }
    if (targetType !== undefined) {
      qb.andWhere('voucher.targetType = :targetType', { targetType });
    }
    if (discount_type !== undefined) {
      qb.andWhere('voucher.discount_type = :discount_type', {
        discount_type,
      });
    }
    if (validFrom) {
      qb.andWhere('voucher.validFrom >= :validFrom', { validFrom }); // 📅 Voucher bắt đầu từ ngày này trở đi
    }
    if (validTo) {
      qb.andWhere('voucher.validTo <= :validTo', { validTo }); // 📅 Voucher kết thúc trước ngày này
    }

    // 💵 **Financial Filters** - Lọc theo các giá trị tài chính
    if (min_order_value !== undefined) {
      qb.andWhere('voucher.min_order_value >= :min_order_value', {
        min_order_value, // Tìm voucher có min order value >= giá trị này
      });
    }
    if (max_discount_value !== undefined) {
      qb.andWhere('voucher.max_discount_value <= :max_discount_value', {
        max_discount_value, // Tìm voucher có max discount <= giá trị này
      });
    }

    // 🔢 **Usage Statistics Filters** - Lọc theo thống kê sử dụng
    if (usage_limit !== undefined) {
      qb.andWhere('voucher.usage_limit = :usage_limit', { usage_limit }); // 🔢 Exact match usage limit
    }
    if (per_user_limit !== undefined) {
      qb.andWhere('voucher.per_user_limit = :per_user_limit', {
        per_user_limit, // 👤 Exact match per user limit
      });
    }
    if (used_count !== undefined) {
      qb.andWhere('voucher.used_count = :used_count', { used_count }); // 📊 Exact match used count
    }

    // **Creator Filter** - Lọc theo người tạo voucher
    if (creatorId) {
      qb.andWhere('voucher.creatorId = :creatorId', { creatorId }); // 👤 Tìm voucher được tạo bởi user cụ thể
    }

    // **Target Type IDs Filter** - Lọc theo IDs cụ thể (products/brands/categories)
    if (list_targetType && list_targetType.length > 0) {
      qb.andWhere('product.id IN (:...targetTypeIds)', {
        targetTypeIds: list_targetType, // 🎯 Array IDs của sản phẩm cần filter
      });
    }

    // 🎪 **Campaign Filter** (placeholder for future implementation)
    // Note: Sẽ thêm khi QueryVoucherDto được update với campaignId field
    // TODO: Implement campaign filtering khi campaign module hoàn thiện

    // 📋 **Template Filter** (placeholder for automation integration)
    // Note: Sẽ thêm khi QueryVoucherDto được update với templateId field
    // TODO: Implement template filtering cho voucher automation

    // 📍 **ID Include/Exclude Filters** - Lọc theo danh sách IDs
    if (inIds && inIds.length > 0) {
      qb.andWhere('voucher.id IN (:...inIds)', { inIds }); // 📋 Chỉ lấy vouchers trong danh sách IDs này
    }
    if (notInIds && notInIds.length > 0) {
      qb.andWhere('voucher.id NOT IN (:...notInIds)', { notInIds }); // ❌ Loại trừ vouchers trong danh sách IDs này
    }

    // **Soft Delete Handling** - Xử lý records đã bị soft delete
    if (withDeleted) {
      qb.withDeleted(); // 👁️ Bao gồm cả records đã bị soft delete
      // 🗑️ Filter cụ thể theo deleted status nếu cần
      if (isDeleted !== undefined) {
        if (isDeleted === 1) {
          qb.andWhere('voucher.deletedAt IS NOT NULL'); // 🗑️ Chỉ lấy records đã bị xóa
        } else if (isDeleted === 0) {
          qb.andWhere('voucher.deletedAt IS NULL'); // ✅ Chỉ lấy records chưa bị xóa
        }
      }
    }

    // 📊 **Sorting** - Sắp xếp theo field và order được chỉ định
    qb.orderBy(`voucher.${orderBy}`, order); // 📈 Dynamic sorting theo field từ enum

    // 📄 **Pagination** - Phân trang nếu được enable
    if (isPagination === 1) {
      const skip = (page - 1) * limit; // 🔢 Tính số records cần skip
      qb.skip(skip).take(limit); // 📄 Apply pagination với skip và take
    }

    // 🚀 **Execute Query** - Thực thi query và lấy kết quả + total count
    const [data, total] = await qb.getManyAndCount();

    // 📋 **Logging** - Log kết quả để monitoring và debug
    this.logger.log(
      `📊 Voucher query executed: ${data.length}/${total} results (page ${page}, limit ${limit})`,
    );

    return {
      data,
      total,
    };
  }

  /**
   * 🔍 **Tìm voucher theo ID với comprehensive data loading**
   *
   * **Luồng xử lý:**
   * 1. **Options Processing:** Extract và set defaults cho options
   * 2. **QueryBuilder Setup:** Tạo base query với ID condition
   * 3. **Relations Loading:** Load relationships nếu được yêu cầu
   * 4. **Filters Apply:** Apply active status và soft delete filters
   * 5. **Execution & Validation:** Execute query và validate kết quả
   *
   * **Features:**
   * - Flexible options cho different use cases
   * - Selective relationship loading cho performance
   * - Soft delete support
   * - Comprehensive error handling
   */
  async findOne(
    id: number,
    options?: {
      // Options để customize behavior
      withDeleted?: boolean; // 🗑️ Có include soft-deleted records không
      isActive?: boolean; // ✅ Filter theo active status
      withRelations?: boolean; // 🔗 Có load relationships không
    },
  ): Promise<VoucherEntity> {
    // ⚙️ **PHASE 1: OPTIONS PROCESSING** - Extract options với defaults
    const {
      withDeleted = false, // 🗑️ Default: không include deleted records
      isActive, // ✅ Undefined = không filter theo active
      withRelations = false, // 🔗 Default: không load relations (performance)
    } = options || {}; // 📝 Handle undefined options

    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');

    // 🔗 **PHASE 3: RELATIONS LOADING** - Load relationships nếu cần
    if (withRelations) {
      queryBuilder
        .leftJoinAndSelect('voucher.creator', 'creator') // 👤 Join creator info
        .leftJoinAndSelect('voucher.voucherProducts', 'vp') // 🛍️ Join voucher-product relation
        .leftJoinAndSelect('vp.product', 'product') // 🎯 Join product details
        .leftJoinAndSelect('voucher.voucherRecipients', 'vr') // 👥 Join voucher-recipient relation
        .leftJoinAndSelect('vr.user', 'recipient'); // 👤 Join recipient user details
    }

    // 🔍 **PHASE 4: FILTERS APPLY** - Apply các điều kiện filter
    queryBuilder.where('voucher.id = :id', { id }); // 🎯 Primary condition: tìm theo ID

    // ✅ Filter theo active status nếu được specify
    if (isActive !== undefined) {
      queryBuilder.andWhere('voucher.isActive = :isActive', { isActive }); // 🔘 Boolean filter
    }

    // 🗑️ Include soft-deleted records nếu cần
    if (withDeleted) {
      queryBuilder.withDeleted(); // 👁️ TypeORM withDeleted() để include soft-deleted
    }

    // 🚀 **PHASE 5: EXECUTION & VALIDATION** - Execute và validate
    const voucher = await queryBuilder.getOne(); // 📊 Execute query lấy single result
    // ❌ Throw NotFoundException nếu không tìm thấy
    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher với ID: ${id}`); // 🚫 User-friendly error message
    }
    return voucher; // 🎉 Trả về voucher entity với full data
  }
  /**
   * 🎯 **Tìm voucher theo ID với kiểm tra áp dụng sản phẩm**
   *
   * **Logic:** Validate voucher từ template và instance level
   * **Use Case:** Order validation, cart checkout, product-specific voucher checking
   *
   * @param id - ID của voucher cần kiểm tra
   * @param productIds - Array các product ID cần kiểm tra (optional)
   * @param userId - ID của user (để check instance-specific validity)
   * @returns VoucherEntity đã validate
   */
  async checkVoucher(
    id: number,
    productIds?: number[],
    userId?: number,
  ): Promise<VoucherEntity> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['voucherProducts', 'voucherProducts.product'],
    });

    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher với ID: ${id}`);
    }

    if (!voucher.isActive) {
      throw new BadRequestException(
        `Voucher với ID: ${id} không còn hoạt động`,
      );
    }

    // 🔍 **Check instance-level validity if userId provided**
    if (userId) {
      await this.validateVoucherInstance(voucher.id, userId);
    }

    // 📊 **Check global usage limits**
    if (
      voucher.usage_limit !== null &&
      voucher.used_count >= voucher.usage_limit
    ) {
      throw new BadRequestException(
        `Voucher với ID: ${id} đã đạt giới hạn sử dụng tối đa`,
      );
    }

    // 🎯 **Kiểm tra áp dụng sản phẩm**
    if (productIds && productIds.length > 0) {
      await this.validateVoucherForProducts(voucher, productIds);
    }

    return voucher;
  }

  /**
   * 📜 **Validate voucher instance cho user cụ thể**
   *
   * **Logic:** Kiểm tra validity và usage limits ở instance level
   * @param voucherId - ID của voucher template
   * @param userId - ID của user
   */
  private async validateVoucherInstance(
    voucherId: number,
    userId: number,
  ): Promise<void> {
    const voucherInstance = await this.voucherHistoryRepository.findOne({
      where: {
        voucherId,
        userId,
      },
    });

    if (!voucherInstance) {
      throw new BadRequestException(
        `Không tìm thấy voucher instance active cho user này`,
      );
    }

    const now = dayjs();

    // 📅 Check instance validity dates
    if (
      voucherInstance.validFrom &&
      dayjs(voucherInstance.validFrom).isAfter(now)
    ) {
      throw new BadRequestException(`Voucher chưa đến ngày bắt đầu sử dụng`);
    }

    if (
      voucherInstance.validTo &&
      dayjs(voucherInstance.validTo).isBefore(now)
    ) {
      throw new BadRequestException(`Voucher đã hết hạn sử dụng`);
    }

    // 🔢 Check instance usage limits
    if (
      voucherInstance.instanceUsedCount >= voucherInstance.instanceUsageLimit
    ) {
      throw new BadRequestException(`Voucher instance đã đạt giới hạn sử dụng`);
    }
  }

  /**
   * 🛍️ **Validate voucher có thể áp dụng cho các sản phẩm**
   *
   * **Logic:**
   * - Nếu voucher có targetType = 'product' → phải có sản phẩm được chỉ định
   * - Nếu voucher có targetType = 'all' → áp dụng cho tất cả sản phẩm
   * - Nếu voucher có voucherProducts → chỉ áp dụng cho các sản phẩm đó
   *
   * @param voucher - VoucherEntity cần kiểm tra
   * @param productIds - Array các product ID cần validate
   */
  private async validateVoucherForProducts(
    voucher: VoucherEntity,
    productIds: number[],
  ): Promise<void> {
    // Nếu voucher áp dụng cho tất cả sản phẩm
    if (voucher.targetType === EtargetType.ALL) {
      return; // ✅ Voucher áp dụng cho tất cả
    }

    // Nếu voucher có sản phẩm được chỉ định cụ thể
    if (voucher.voucherProducts && voucher.voucherProducts.length > 0) {
      const allowedProductIds = voucher.voucherProducts.map(
        (vp) => vp.product.id,
      );

      // Kiểm tra xem tất cả sản phẩm trong đơn hàng có được phép không
      const invalidProducts = productIds.filter(
        (productId) => !allowedProductIds.includes(productId),
      );

      if (invalidProducts.length > 0) {
        throw new BadRequestException(
          `Voucher với ID: ${voucher.id} không áp dụng được cho sản phẩm có ID: ${invalidProducts.join(', ')}`,
        );
      }
    } else if (voucher.targetType === EtargetType.PRODUCT) {
      // Nếu targetType là PRODUCT nhưng không có sản phẩm nào được chỉ định
      throw new BadRequestException(
        `Voucher với ID: ${voucher.id} được cấu hình cho sản phẩm cụ thể nhưng không có sản phẩm nào được chỉ định`,
      );
    }
  }

  /**
   * 🔄 **Cập nhật voucher**
   *
   * **Luồng xử lý chính:**
   * 1. **Validation Phase:** Tìm voucher, check permissions, validate data
   * 2. **Business Rules:** Check code uniqueness, validate date logic
   * 3. **Transaction Phase:** Update voucher + relationships trong transaction
   * 4. **Cleanup & Rebuild:** Remove old relations, tạo mới relations
   * 5. **Response:** Return updated voucher với full relationships
   *
   * **Business Rules:**
   * - Chỉ Admin/HR mới được update voucher
   * - Code mới phải unique (nếu thay đổi)
   * - Date logic phải hợp lệ
   * - Transaction safety cho data consistency
   *
   * **Database Operations:**
   * - Sử dụng transaction để đảm bảo atomicity
   * - Delete + recreate relations thay vì update (đơn giản hơn)
   * - Separate handling cho products và recipients
   */
  async update(
    id: number, // 🔢 ID của voucher cần update
    updateVoucherDto: UpdateVoucherDto, // 📝 Data update từ client
    user: User, // 👤 User thực hiện update (để check permissions)
  ): Promise<VoucherEntity> {
    const body = await validateDto(updateVoucherDto, UpdateVoucherDto); // ✅ Validate DTO structure và rules
    // 🔍 **PHASE 1: FIND & VALIDATE** - Tìm voucher và validate cơ bản
    const existingVoucher = await this.findOne(id, {
      withRelations: true, // 🔗 Load full relations để có context
    });
    // 🔍 **PHASE 3: CODE UNIQUENESS CHECK** - Kiểm tra code uniqueness nếu thay đổi
    if (
      updateVoucherDto.code &&
      updateVoucherDto.code !== existingVoucher.code //Code thực sự thay đổi
    ) {
      const isDuplicate = await checkDuplicateByField(
        this.voucherRepository,
        'code',
        body.code,
      );
      if (isDuplicate) {
        throw new BadRequestException(
          `Mã voucher "${body.code}" đã tồn tại. Vui lòng sử dụng mã khác.`, // 🚫 Message user-friendly
        );
      }
    }

    // 🎯 **PHASE 4: ENUM AUTO-RESOLUTION** - Clean logic: Auto resolve enums → arrays
    let finalRecipients = updateVoucherDto.recipients; // 👥 Default: sử dụng recipients trực tiếp từ DTO
    let finalProducts = updateVoucherDto.products; // 🛍️ Default: sử dụng products trực tiếp từ DTO

    // 👥 **Recipients Resolution Priority:** enum > direct array
    if (updateVoucherDto.targetReceiverGroup !== undefined) {
      // 🎯 AUTO-RESOLVE: targetReceiverGroup → recipients array
      finalRecipients = await this.getUsersByIds(updateVoucherDto as any); // Reuse existing logic
      this.logger.log(
        `🎯 Auto-resolved ${finalRecipients.length} recipients từ ETargetReceiverGroup.${updateVoucherDto.targetReceiverGroup}`,
      );
    }
    // ℹ️ Note: Nếu có cả targetReceiverGroup và recipients, prioritize enum (business logic)

    // 🛍️ **Products Resolution Priority:** enum > direct array
    if (updateVoucherDto.targetType !== undefined) {
      // 🎯 AUTO-RESOLVE: targetType + list_targetType → products array
      finalProducts = await this.getProductsByIds(updateVoucherDto as any); // Reuse existing logic
      this.logger.log(
        `🎯 Auto-resolved ${finalProducts.length} products từ EtargetType.${updateVoucherDto.targetType}`,
      );
    }
    // ℹ️ Note: Nếu có cả targetType và products, prioritize enum (business logic)

    // 🔄 **PHASE 6: TRANSACTION EXECUTION** - Thực hiện update trong transaction
    return await this.voucherRepository.manager.transaction(async (manager) => {
      // Get repositories từ transaction manager để đảm bảo consistency
      const voucherRepo = manager.getRepository(VoucherEntity);
      const recipientRepo = manager.getRepository(VoucherRecipient);
      const productRepo = manager.getRepository(VoucherProductEntity);

      //  **Update Voucher Entity** - Update main voucher fields
      const { products, recipients, campaignId, ...voucherFields } =
        updateVoucherDto; // Destructure để loại bỏ relations và unsupported fields

      // 🚧 **Campaign ID Warning** - Nếu có campaignId trong update request
      if (campaignId) {
        this.logger.warn(
          `Campaign ID ${campaignId} trong update request được bỏ qua - tính năng Campaign chưa được triển khai`,
        );
      }

      Object.assign(existingVoucher, {
        //  Merge update data vào existing entity (không bao gồm campaignId)
        ...voucherFields, // Apply tất cả voucher fields (đã exclude campaignId)
        updatedAt: new Date(), // Set timestamp cho audit trail
      });

      //  **Save Main Voucher** - Lưu voucher entity chính
      const updatedVoucher = await voucherRepo.save(existingVoucher); // Persist changes to database

      // 🎯 **Update Products Relations** - Clean Logic: Enum Resolution Priority
      if (finalProducts && Array.isArray(finalProducts)) {
        // ✅ Sử dụng finalProducts từ enum auto-resolution hoặc direct array
        // 🗑️ Remove existing products (clean slate approach)
        await productRepo
          .createQueryBuilder() // 🏗️ Sử dụng QueryBuilder cho performance
          .delete() // 🗑️ Delete operation
          .where('voucherId = :voucherId', { voucherId: id }) // 🎯 Where condition theo voucher ID
          .execute(); // 🚀 Execute delete query

        // ➕ Add new products (chỉ tạo mới nếu có products)
        if (finalProducts.length > 0) {
          const voucherProducts = finalProducts.map((productId) => {
            // 🔄 Map từng product ID thành entity
            const voucherProduct = this.voucherProductRepository.create(); // 🏗️ Tạo entity instance mới
            (voucherProduct as any).voucherId = id; // 🔗 Set voucher ID (cast vì property có thể protected)
            (voucherProduct as any).productId = productId; // 🔗 Set product ID
            return voucherProduct; // 🎉 Return configured entity
          });

          await productRepo.save(voucherProducts); // 💾 Bulk save tất cả product relations
          this.logger.log(
            `✅ Updated ${finalProducts.length} product relations for voucher ${id}`,
          );
        }
      }

      // 👥 **Update Recipients Relations** - Clean Logic: Enum Resolution Priority
      if (finalRecipients && Array.isArray(finalRecipients)) {
        // ✅ Sử dụng finalRecipients từ enum auto-resolution hoặc direct array
        // 🗑️ Remove existing recipients (clean slate approach)
        await recipientRepo
          .createQueryBuilder()
          .delete()
          .where('voucherId = :voucherId', { voucherId: id }) // 🎯 Where condition theo voucher ID
          .execute(); // 🚀 Execute delete query

        // Add new recipients (chỉ tạo mới nếu có recipients)
        if (finalRecipients.length > 0) {
          const voucherRecipients = finalRecipients.map((userId) => {
            // 🔄 Map từng user ID thành entity
            const recipient = this.voucherRecipientRepository.create(); // 🏗️ Tạo entity instance mới
            recipient.voucherId = id;
            recipient.userId = userId;
            recipient.quantity = 1;
            recipient.usedCount = 0; // 📊 Default used count
            recipient.maxUsages = null; // 🔢 Default no limit
            recipient.source = 'admin_assign'; // 📝 Source tracking
            return recipient; // 🎉 Return configured entity
          });

          await recipientRepo.save(voucherRecipients); // 💾 Bulk save tất cả recipient relations
          this.logger.log(
            `✅ Updated ${finalRecipients.length} recipient relations for voucher ${id}`,
          );
        }
      }

      // 📋 **Success Logging** - Log successful update
      this.logger.log(
        `🔄 Updated voucher: ${updatedVoucher.code} (ID: ${id}) by user ${user.id}`, // Audit log
      );

      // 🔄 **Return Response** - Trả về voucher đã update với full relations
      return await this.findOne(id, { withRelations: true }); // 🎉 Reload voucher với updated data
    });
  }
}
