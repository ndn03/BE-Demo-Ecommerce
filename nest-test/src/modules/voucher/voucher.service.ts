import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner } from 'typeorm';
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
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
} from '@src/common/type.common';
import { ERole } from '@src/configs/role.config';

// Entities
import { VoucherEntity } from '@src/entities/voucher.entity';
import { CategoryEntity } from '@src/entities/categories.entity';
import { BrandsEntity } from '@src/entities/brands.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { User } from '@src/entities/user.entity';
import { VoucherRecipient } from '@src/entities/voucher.user.entity';
import { VoucherProductEntity } from '@src/entities/voucher.products.entity';

// DTOs
import { CreateVoucherDto } from './dto/create.voucher.dto';

/**
 * Service xử lý logic nghiệp vụ cho voucher/mã giảm giá
 */
@Injectable()
export class VoucherService extends BaseService<VoucherEntity> {
  private readonly logger = new Logger(VoucherService.name);

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
    @InjectRepository(VoucherRecipient)
    private readonly voucherRecipientRepository: Repository<VoucherRecipient>,
    @InjectRepository(VoucherProductEntity)
    private readonly voucherProductRepository: Repository<VoucherProductEntity>,
  ) {
    super(voucherRepository);
  }

  /**
   * Tạo mới voucher/mã giảm giá
   */
  async createVoucher(
    user: User,
    data: CreateVoucherDto,
  ): Promise<VoucherEntity> {
    this.logger.log(`User ${user.id} tạo voucher với code: ${data.code}`);

    // 1. Validate input
    const body = await validateDto(data, CreateVoucherDto);
    await this.validateUserPermissions(user);
    await this.validateVoucherBusinessRules(body);
    await this.checkDuplicateVoucherCode(body.code);
    this.validateDateRange(body.validFrom, body.validTo);
    this.validateDiscountValue(body.value_discount, body.discount_type);

    // 2. Process data
    const voucherEntity = this.createVoucherEntity(body, user);
    const receiverIds = await this.getUsersByIds(body);
    const productIds = await this.getProductsByIds(body);

    this.logger.log(
      `Validation hoàn tất. ReceiverIds: ${receiverIds.length}, ProductIds: ${productIds.length}`,
    );

    // 3. Save in transaction
    const queryRunner =
      this.voucherRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedVoucher = await queryRunner.manager.save(
        VoucherEntity,
        voucherEntity,
      );
      this.logger.log(
        `Tạo voucher thành công với ID: ${savedVoucher.id}, Code: ${savedVoucher.code}`,
      );

      if (receiverIds.length > 0) {
        await this.createVoucherRecipients(
          queryRunner,
          savedVoucher.id,
          receiverIds,
        );
        this.logger.log(`Tạo ${receiverIds.length} VoucherRecipient records`);
      }

      if (productIds.length > 0) {
        await this.createVoucherProducts(
          queryRunner,
          savedVoucher.id,
          productIds,
        );
        this.logger.log(`Tạo ${productIds.length} VoucherProduct records`);
      }

      await queryRunner.commitTransaction();
      this.logVoucherCreationDetails(savedVoucher, receiverIds, productIds);

      return savedVoucher;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi khi lưu voucher: ${error.message}`, error.stack);
      throw new BadRequestException(`Không thể tạo voucher: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private async validateUserPermissions(user: User): Promise<void> {
    const allowedRoles = [
      ERole.ADMINISTRATOR,
      ERole.HUMAN_RESOURCES,
      ERole.EMPLOYEE,
    ];
    if (!allowedRoles.includes(user.role)) {
      throw new BadRequestException('Bạn không có quyền tạo voucher');
    }
  }

  private async validateVoucherBusinessRules(
    body: CreateVoucherDto,
  ): Promise<void> {
    if (
      body.usage_limit !== undefined &&
      body.usage_limit !== null &&
      body.usage_limit <= 0
    ) {
      throw new BadRequestException('Giới hạn sử dụng phải lớn hơn 0');
    }

    if (
      body.per_user_limit !== undefined &&
      body.per_user_limit !== null &&
      body.per_user_limit <= 0
    ) {
      throw new BadRequestException('Giới hạn sử dụng mỗi user phải lớn hơn 0');
    }

    if (
      body.min_order_value !== undefined &&
      body.min_order_value !== null &&
      body.min_order_value < 0
    ) {
      throw new BadRequestException('Giá trị đơn hàng tối thiểu không được âm');
    }

    if (
      body.max_discount_value !== undefined &&
      body.max_discount_value !== null
    ) {
      if (body.max_discount_value <= 0) {
        throw new BadRequestException('Giá trị giảm tối đa phải lớn hơn 0');
      }

      if (
        body.discount_type === ETypeDiscount.PERCENTAGE &&
        body.min_order_value
      ) {
        const maxPossibleDiscount =
          (body.min_order_value * body.value_discount) / 100;
        if (body.max_discount_value > maxPossibleDiscount * 2) {
          this.logger.warn(
            `Max discount value (${body.max_discount_value}) có thể quá cao so với min order value`,
          );
        }
      }
    }

    if (body.campaignId) {
      await this.validateCampaignId(body.campaignId);
    }
  }

  private async checkDuplicateVoucherCode(code: string): Promise<void> {
    const isDuplicate = await checkDuplicateByField(
      this.voucherRepository,
      'code',
      code,
    );
    if (isDuplicate) {
      throw new BadRequestException(
        `Mã voucher "${code}" đã tồn tại. Vui lòng sử dụng mã khác.`,
      );
    }
  }

  private validateDateRange(validFrom: Date, validTo: Date): void {
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const startDate = dayjs(validFrom).tz('Asia/Ho_Chi_Minh');
    const endDate = dayjs(validTo).tz('Asia/Ho_Chi_Minh');

    if (startDate.isBefore(now.subtract(5, 'minute'))) {
      throw new BadRequestException(
        'Thời gian bắt đầu không được trong quá khứ',
      );
    }

    if (endDate.isBefore(startDate)) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    }

    if (endDate.diff(startDate, 'hour') < 1) {
      throw new BadRequestException('Voucher phải có hiệu lực ít nhất 1 giờ');
    }

    if (endDate.diff(startDate, 'year') > 1) {
      this.logger.warn(
        `Voucher có thời gian hiệu lực dài: từ ${startDate.format('DD/MM/YYYY')} đến ${endDate.format('DD/MM/YYYY')}`,
      );
    }
  }

  private validateDiscountValue(value: number, type: ETypeDiscount): void {
    if (value <= 0) {
      throw new BadRequestException('Giá trị giảm giá phải lớn hơn 0');
    }

    switch (type) {
      case ETypeDiscount.PERCENTAGE:
        if (value > 100) {
          throw new BadRequestException(
            'Giá trị phần trăm giảm giá không được vượt quá 100%',
          );
        }
        if (value > 50) {
          this.logger.warn(`Giá trị giảm giá cao: ${value}% - cần xem xét kỹ`);
        }
        break;

      case ETypeDiscount.AMOUNT:
        if (value > 10_000_000) {
          this.logger.warn(
            `Giá trị giảm giá rất cao: ${value.toLocaleString('vi-VN')} VND`,
          );
        }
        break;

      default:
        throw new BadRequestException(`Loại giảm giá không hợp lệ: ${type}`);
    }
  }

  private createVoucherEntity(
    body: CreateVoucherDto,
    user: User,
  ): VoucherEntity {
    const voucher = new VoucherEntity();

    voucher.code = body.code.toUpperCase().trim();
    voucher.value_discount = body.value_discount;
    voucher.discount_type = body.discount_type;
    voucher.description = body.description || null;
    voucher.validFrom = body.validFrom;
    voucher.validTo = body.validTo;
    voucher.targetReceiverGroup =
      body.targetReceiverGroup || ETargetReceiverGroup.ALL_CUSTOMER;
    voucher.targetType = body.targetType;
    voucher.min_order_value = body.min_order_value || null;
    voucher.max_discount_value = body.max_discount_value || null;
    voucher.usage_limit = body.usage_limit || null;
    voucher.used_count = body.used_count || 0;
    voucher.per_user_limit = body.per_user_limit || 1;
    voucher.status = body.status || ('ACTIVE' as any);
    voucher.isActive = body.isActive !== undefined ? body.isActive : true;
    voucher.isPublic = body.isPublic !== undefined ? body.isPublic : false;
    voucher.campaignId = null; // Campaign feature not implemented yet

    return voucher;
  }

  private async validateCampaignId(campaignId: number): Promise<void> {
    this.logger.warn(
      `Campaign ID ${campaignId} được request nhưng VoucherCampaign repository chưa được implement`,
    );
    throw new BadRequestException(
      'Tính năng Campaign chưa được triển khai. Vui lòng tạo voucher không liên kết campaign (bỏ trống campaignId)',
    );
  }

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
      validFrom: dayjs(voucher.validFrom).format('DD/MM/YYYY HH:mm'),
      validTo: dayjs(voucher.validTo).format('DD/MM/YYYY HH:mm'),
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
      const query = this.usersRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: body.receiverIds });

      if (role) {
        query.andWhere('user.role IN (:...roles)', {
          roles: Array.isArray(role) ? role : [role],
        });
      }
      const users = await query.select('user.id', 'id').getRawMany();
      const finalIds = users.map((u) => u.id);

      if (finalIds.length === 0) {
        throw new BadRequestException('Không tìm thấy người dùng hợp lệ');
      } else if (finalIds.length !== body.receiverIds.length) {
        const excludedIds = body.receiverIds.filter(
          (id) => !finalIds.includes(id),
        );
        throw new BadRequestException(
          `Một số người dùng không hợp lệ hoặc không thuộc nhóm được chọn: ${excludedIds.join(', ')}`,
        );
      }
      return finalIds;
    }

    const query = this.usersRepository.createQueryBuilder('user');
    if (role) {
      query.where('user.role IN (:...roles)', {
        roles: Array.isArray(role) ? role : [role],
      });
    }
    const users = await query.select('user.id', 'id').getRawMany();
    const finalIds = users.map((u) => u.id);

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
      [ETargetReceiverGroup.ALL]: null,
      [ETargetReceiverGroup.HUMAN_RESOURCES]: ERole.HUMAN_RESOURCES,
      [ETargetReceiverGroup.EMPLOYEE]: ERole.EMPLOYEE,
      [ETargetReceiverGroup.CUSTOMER]: ERole.CUSTOMER,
      [ETargetReceiverGroup.ALL_CUSTOMER]: [
        ERole.CUSTOMER,
        ERole.CUSTOMER_VIP1,
        ERole.CUSTOMER_VIP2,
        ERole.CUSTOMER_VIP3,
      ],
      [ETargetReceiverGroup.CUSTOMER_VIP]: [
        ERole.CUSTOMER_VIP1,
        ERole.CUSTOMER_VIP2,
        ERole.CUSTOMER_VIP3,
      ],
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

  // Helper validation methods
  private async checkProductIds(productIds: number[]): Promise<number[]> {
    const products = await this.productsRepository.find({
      where: { id: In(productIds) },
      select: ['id'],
    });

    if (products.length === 0) {
      throw new BadRequestException('Không tìm thấy sản phẩm hợp lệ');
    }

    const foundProductIds = products.map((p) => p.id);
    const invalidProductIds = productIds.filter(
      (id) => !foundProductIds.includes(id),
    );

    if (invalidProductIds.length > 0) {
      throw new BadRequestException(
        `Các sản phẩm không tồn tại: ${invalidProductIds.join(', ')}`,
      );
    }

    return foundProductIds;
  }

  private async checkBrandIds(brandIds: number[]): Promise<number[]> {
    const brands = await this.brandsRepository.find({
      where: { id: In(brandIds) },
      select: ['id'],
    });

    if (brands.length === 0) {
      throw new BadRequestException('Không tìm thấy thương hiệu hợp lệ');
    }

    const foundBrandIds = brands.map((b) => b.id);
    const invalidBrandIds = brandIds.filter(
      (id) => !foundBrandIds.includes(id),
    );

    if (invalidBrandIds.length > 0) {
      throw new BadRequestException(
        `Các thương hiệu không tồn tại: ${invalidBrandIds.join(', ')}`,
      );
    }

    return foundBrandIds;
  }

  private async checkCategoryIds(categoryIds: number[]): Promise<number[]> {
    const categories = await this.categoriesRepository.find({
      where: { id: In(categoryIds) },
      select: ['id'],
    });

    if (categories.length === 0) {
      throw new BadRequestException('Không tìm thấy danh mục hợp lệ');
    }

    const foundCategoryIds = categories.map((c) => c.id);
    const invalidCategoryIds = categoryIds.filter(
      (id) => !foundCategoryIds.includes(id),
    );

    if (invalidCategoryIds.length > 0) {
      throw new BadRequestException(
        `Các danh mục không tồn tại: ${invalidCategoryIds.join(', ')}`,
      );
    }

    return foundCategoryIds;
  }

  private async getProductsByIds(body: CreateVoucherDto): Promise<number[]> {
    const targetType = this.mapTargetProducts(body.targetType);

    if (targetType === EtargetType.ALL) {
      if (body.voucher_productIds && body.voucher_productIds.length > 0) {
        this.logger.warn(
          `targetType=ALL nhưng có voucher_productIds=[${body.voucher_productIds.join(', ')}]. Sẽ áp dụng cho cụ thể sản phẩm này.`,
        );
        return await this.validateAndReturnProductIds(body.voucher_productIds);
      }

      // Lấy tất cả sản phẩm hiện có trong database
      this.logger.log(
        'Voucher áp dụng cho tất cả sản phẩm - lấy danh sách tất cả sản phẩm',
      );
      const allProducts = await this.productsRepository.find({
        select: ['id'],
      });
      const allProductIds = allProducts.map((p) => p.id);

      this.logger.log(
        `Tìm thấy ${allProductIds.length} sản phẩm để áp dụng voucher`,
      );
      return allProductIds;
    }

    if (!body.voucher_productIds || body.voucher_productIds.length === 0) {
      throw new BadRequestException(
        `voucher_productIds không được để trống khi targetType là ${Object.keys(EtargetType)[Object.values(EtargetType).indexOf(targetType)]}`,
      );
    }

    switch (targetType) {
      case EtargetType.BRAND:
        return await this.getProductsByBrandIds(body.voucher_productIds);
      case EtargetType.CATEGORY:
        return await this.getProductsByCategoryIds(body.voucher_productIds);
      case EtargetType.PRODUCT:
        return await this.validateAndReturnProductIds(body.voucher_productIds);
      default:
        throw new BadRequestException(
          `targetType không được hỗ trợ: ${targetType}`,
        );
    }
  }

  private async getProductsByBrandIds(brandIds: number[]): Promise<number[]> {
    // Validate brand IDs first
    const validBrandIds = await this.checkBrandIds(brandIds);

    // Get products by validated brand IDs
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .innerJoin('product.brand', 'brand')
      .where('brand.id IN (:...brandIds)', { brandIds: validBrandIds })
      .select('product.id')
      .getRawMany();

    if (products.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy sản phẩm nào thuộc các thương hiệu đã chọn',
      );
    }

    const productIds = products.map((p) => p.product_id);
    this.logger.log(
      `Tìm thấy ${productIds.length} sản phẩm từ ${validBrandIds.length} thương hiệu`,
    );

    return productIds;
  }

  private async getProductsByCategoryIds(
    categoryIds: number[],
  ): Promise<number[]> {
    // Validate category IDs first
    const validCategoryIds = await this.checkCategoryIds(categoryIds);

    // Get products by validated category IDs
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .innerJoin('product.categories', 'category')
      .where('category.id IN (:...categoryIds)', {
        categoryIds: validCategoryIds,
      })
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
      `Tìm thấy ${productIds.length} sản phẩm từ ${validCategoryIds.length} danh mục`,
    );

    return productIds;
  }

  private async validateAndReturnProductIds(
    productIds: number[],
  ): Promise<number[]> {
    const validProductIds = await this.checkProductIds(productIds);
    this.logger.log(`Validated ${validProductIds.length} sản phẩm hợp lệ`);
    return validProductIds;
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
          const voucherProduct = new VoucherProductEntity();
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
}
