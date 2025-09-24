import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../../entities/products.entity';
import { BaseService } from '@src/common/services/base.service';
import { Brackets, Repository, QueryRunner, In } from 'typeorm';
import { MediaService } from '../upload/media.service';
import { checkDuplicateByField } from 'src/common/context/helper/check-field-duplicate';
import { CreateProductDto } from './dto/create.product.dto';
import { User } from '@src/entities/user.entity';
import { validateDto } from '@src/common/utils/validation.util';
import { SubImgProductEntity } from 'src/entities/sub-img-product.entity';
import { CategoriesService } from '../category/category.service';
import { BrandsService } from '../brand/brand.service';
import { ETypeDiscount } from '@src/common/type.common';
import { QueryProductDto } from './dto/query.product.dto';
import { EOrder } from '@src/common/type.common';
import { EProduct } from './product.interface';
import * as dayjs from 'dayjs';
import { UpdateProductDto } from './dto/update.product.dto';

@Injectable()
export class ProductService extends BaseService<ProductsEntity> {
  constructor(
    @InjectRepository(ProductsEntity)
    private readonly productRepository: Repository<ProductsEntity>,
    private readonly mediaService: MediaService,
    private readonly CategoriesService: CategoriesService,
    private readonly BrandsService: BrandsService,

    @InjectRepository(SubImgProductEntity)
    private readonly subImgProductRepository: Repository<SubImgProductEntity>,
  ) {
    super(productRepository);
  }

  async create(
    user: User,
    body: CreateProductDto,
    image: Express.Multer.File,
    subImages: Express.Multer.File[],
  ): Promise<ProductsEntity> {
    const validate = await validateDto(body, CreateProductDto);
    delete validate.subImages;
    delete validate.image;
    // Kiểm tra tên sản phẩm có bị trùng không
    if (validate.name) {
      const isDuplicate = await checkDuplicateByField(
        this.productRepository,
        'name',
        validate.name,
        {
          alias: 'product',
          withDeleted: false,
          idColumn: 'id',
        },
      );

      if (isDuplicate) {
        throw new BadRequestException({
          message: 'Tên sản phẩm đã tồn tại',
        });
      }
    }

    // Tính giá sau giảm giá
    const priceAfterDiscount = this.discountPrice(
      validate.price,
      validate.discount || 0,
      validate.typeDiscount || ETypeDiscount.NO_DISCOUNT,
    );

    // Kiểm tra danh mục và thương hiệu
    const categoryIds = (validate.categoryIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    if (categoryIds.length > 0) {
      const checkCategory =
        await this.CategoriesService.checkCategoryIds(categoryIds);
      if (!checkCategory) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
      }
    }

    const brandExists = await this.BrandsService.findOne(
      Number(validate.brand),
      false,
    );
    if (!brandExists) {
      throw new BadRequestException('Thương hiệu không tồn tại');
    }

    let imageUrl: string | null = null;
    let imgFileId: string | null = null;
    let subImagesData: string[] | null = null;
    let subImgFileIds: string[] | null = null;
    let subImageEntities: SubImgProductEntity[] = [];
    const rollbackFileIds: string[] = [];

    const queryRunner: QueryRunner =
      this.productRepository.manager.connection.createQueryRunner();
    // await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Upload ảnh chính
      if (image) {
        const result = await this.mediaService.uploadFile(
          image,
          'product-image',
        );
        if (!result?.fileData?.url || !result?.fileData?.fileId) {
          throw new BadRequestException(
            'Upload ảnh chính thất bại: Dữ liệu trả về không hợp lệ',
          );
        }
        imageUrl = result.fileData.url;
        imgFileId = result.fileData.fileId;
        rollbackFileIds.push(imgFileId);
      }

      // Upload ảnh phụ
      if (subImages && subImages.length > 0) {
        const result = await this.mediaService.uploadFiles(
          subImages,
          'subImages',
        );
        const uploadedFiles = result.map((fileData) => {
          if (!fileData?.fileData?.url || !fileData?.fileData?.fileId) {
            throw new BadRequestException(
              'Upload ảnh phụ thất bại: Dữ liệu trả về không hợp lệ',
            );
          }
          return {
            url: fileData.fileData.url,
            fileId: fileData.fileData.fileId,
          };
        });
        subImagesData = uploadedFiles.map((img) => img.url);
        subImgFileIds = uploadedFiles.map((img) => img.fileId);
        rollbackFileIds.push(...subImgFileIds);

        subImageEntities = subImagesData.map((url) => {
          const sub = new SubImgProductEntity();
          sub.url = url;
          return sub;
        });
      }

      // Tạo và lưu sản phẩm
      const newProduct = this.productRepository.create({
        ...validate,
        categoryIds: categoryIds.map((id) => ({ id })),
        image: imageUrl,
        isActive: true,
        final_price: priceAfterDiscount,
        creatorId: user.id,
        brand: { id: validate.brand },
      });
      // Bước 1: Lưu entity sản phẩm để lấy ID
      const savedProduct = await this.productRepository.save(newProduct);

      // Bước 3: Gán quan hệ product cho từng entity ảnh phụ và lưu vào DB
      if (subImageEntities.length > 0) {
        subImageEntities.forEach((subImg) => {
          subImg.product = savedProduct;
        });
        await this.subImgProductRepository.save(subImageEntities);
      }

      await queryRunner.commitTransaction();
      // Truy vấn lại sản phẩm với các quan hệ
      return await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['brand', 'categoryIds', 'subImages'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Rollback tất cả file đã upload
      if (rollbackFileIds.length > 0) {
        await this.mediaService.rollbackFile(rollbackFileIds).catch((err) => {
          throw new Error(`Rollback files failed: ${err}`);
        });
      }
      throw new BadRequestException(`Tạo sản phẩm thất bại: ${error}`);
    } finally {
      // Giải phóng queryRunner
      await queryRunner.release();
    }
  }

  discountPrice(price: number, discount: number, type: ETypeDiscount): number {
    switch (type) {
      case ETypeDiscount.PERCENTAGE:
        if (discount < 0 || discount > 100) {
          throw new BadRequestException('Phần trăm giảm giá không hợp lệ');
        }
        return price - (price * discount) / 100;

      case ETypeDiscount.AMOUNT:
        if (discount < 0 || discount > price) {
          throw new BadRequestException('Giá trị giảm giá không hợp lệ');
        }
        return price - discount;

      case ETypeDiscount.NO_DISCOUNT:
      default:
        return price;
    }
  }

  async findAll(query: QueryProductDto) {
    const queryDto = await validateDto(query, QueryProductDto);

    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EProduct.name,
      search,
      isDeleted,
      withDeleted,
      name,
      description,
      price,
      status,
      stock,
      final_price,
      typeDiscount,
      isActive,
      from,
      to,
      priceRangeFrom,
      priceRangeTo,
      'categoryIds[]': categoryIds,
      creatorId,
    } = queryDto;

    const inIds = queryDto?.['inIds[]'];
    const notInIds = queryDto?.['notInIds[]'];

    const qb = this.productRepository.createQueryBuilder('product');
    qb.leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categoryIds', 'category')
      .leftJoinAndSelect('product.subImages', 'subImages')
      .leftJoin('product.creator', 'user')
      .addSelect(['user.id']);
    // search
    if (search) {
      qb.andWhere(
        new Brackets((qbs) => {
          qbs
            .where('LOWER(product.name) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(product.description) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            });
        }),
      );
    }

    if (name) {
      qb.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (description) {
      qb.andWhere('LOWER(product.description) LIKE LOWER(:description)', {
        description: `%${description.toLowerCase()}%`,
      });
    }

    if (typeof price !== 'undefined') {
      qb.andWhere('product.price = :price', { price });
    }
    if (typeof final_price !== 'undefined') {
      qb.andWhere('product.final_price = :final_price', {
        final_price,
      });
    }
    if (typeof typeDiscount !== 'undefined') {
      qb.andWhere('product.typeDiscount = :typeDiscount', { typeDiscount });
    }
    if (typeof stock !== 'undefined') {
      qb.andWhere('product.stock = :stock', { stock });
    }
    if (status) {
      qb.andWhere('product.status = :status', { status });
    }
    if (typeof isActive !== 'undefined') {
      qb.andWhere('product.isActive = :isActive', { isActive });
    }

    if (categoryIds?.length > 0) {
      qb.andWhere('category.id IN (:...categoryIds)', { categoryIds });
    }
    if (creatorId) {
      qb.andWhere('user.id = :creatorId', { creatorId });
    }
    if (from || to) {
      if (from) {
        qb.andWhere('product.final_price >= :from', {
          from: dayjs(from).startOf('day').toDate(),
        });
      }
      if (to) {
        qb.andWhere('product.final_price <= :to', {
          to: dayjs(to).endOf('day').toDate(),
        });
      }
    }
    if (priceRangeFrom || priceRangeTo) {
      if (priceRangeFrom) {
        qb.andWhere('product.final_price >= :priceRangeFrom', {
          priceRangeFrom,
        });
      }
      if (priceRangeTo) {
        qb.andWhere('product.final_price <= :priceRangeTo', {
          priceRangeTo,
        });
      }
    }
    // deleted filter
    if (withDeleted) {
      qb.withDeleted();
      if (isDeleted === 1) {
        qb.andWhere('product.deletedAt IS NOT NULL');
      }
      if (isDeleted === 0) {
        qb.andWhere('product.deletedAt IS NULL');
      }
    } else {
      qb.andWhere('product.deletedAt IS NULL');
    }

    if (inIds?.length > 0) {
      qb.andWhere('product.id IN (:...ids)', { ids: inIds });
    }
    if (notInIds?.length > 0) {
      qb.andWhere('product.id NOT IN (:...notInIds)', { notInIds });
    }

    qb.orderBy(`product.${orderBy}`, order);

    // get total count (clone query để tránh ảnh hưởng phân trang)
    const total = await qb.getCount();
    let isPagination = queryDto.isPagination;
    // auto set isPagination nếu client không truyền
    if (isPagination === undefined || isPagination === null) {
      isPagination = total > 10 ? 1 : 0;
    }

    let data: ProductsEntity[];

    if (isPagination === 1) {
      data = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    } else {
      data = await qb.getMany();
      // page = 1;
      // limit = total;
    }

    return {
      message: 'Products retrieved successfully',
      data,
      total,
      page,
      limit,
      totalPages: isPagination ? Math.ceil(total / limit) : 1,
    };
  }

  async findOne(
    id: number,
    withDeleted: boolean = false,
    isActive?: boolean,
  ): Promise<ProductsEntity> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    queryBuilder
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categoryIds', 'category')
      .leftJoinAndSelect('product.subImages', 'subImages');
    queryBuilder.where('product.id = :id', { id });
    if (isActive != null) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }
    if (withDeleted) queryBuilder.withDeleted();

    const product = await queryBuilder.getOne();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    id: number,
    body: UpdateProductDto,
    user: User,
    image?: Express.Multer.File,
    subImages?: Express.Multer.File[],
  ): Promise<ProductsEntity> {
    const validate = await validateDto(body, UpdateProductDto);

    // Xóa image và subImages ra khỏi body vì đã được xử lý riêng (file upload)
    delete validate.image;
    delete validate.subImages;

    // Kiểm tra sự tồn tại của sản phẩm
    const product = await this.findOne(id, false);
    if (!product) {
      throw new NotFoundException({ message: 'Brand not found' });
    }
    // Kiểm tra trùng lặp tên sản phẩm (nếu có thay đổi tên)
    if (validate.name && validate.name !== product.name) {
      const isDuplicate = await checkDuplicateByField(
        this.productRepository,
        'name',
        validate.name,
        {
          alias: 'product',
          excludeId: id,
          withDeleted: false,
          idColumn: 'id',
        },
      );
      if (isDuplicate) {
        throw new BadRequestException('Tên sản phẩm đã tồn tại');
      }
    }

    // Tính giá sau giảm giá (nếu có thay đổi)
    let priceAfterDiscount = product.final_price;
    if (validate.price || validate.discount || validate.typeDiscount) {
      priceAfterDiscount = this.discountPrice(
        validate.price ?? product.price,
        validate.discount ?? product.discount ?? 0,
        validate.typeDiscount ??
          product.typeDiscount ??
          ETypeDiscount.NO_DISCOUNT,
      );
    }

    // Kiểm tra danh mục (nếu có thay đổi)
    let categoryIds = product.categoryIds.map((cat) => cat.id);
    if (validate.categoryIds && validate.categoryIds.length > 0) {
      categoryIds = validate.categoryIds
        .map((id) => Number(id))
        .filter(Boolean);
      const checkCategory =
        await this.CategoriesService.checkCategoryIds(categoryIds);
      if (!checkCategory) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
      }
    }

    // Kiểm tra thương hiệu (nếu có thay đổi)
    let brandId = product.brand.id;
    if (validate.brand) {
      const brandExists = await this.BrandsService.findOne(
        Number(validate.brand),
        false,
      );
      if (!brandExists) {
        throw new BadRequestException('Thương hiệu không tồn tại');
      }
      brandId = Number(validate.brand);
    }

    if (body.isActive !== undefined) {
      product.isActive = body.isActive === 1;
    }

    let imageUrl: string | null = product.image;
    let imgFileId: string | null = null;
    let subImagesData: string[] | null = null;
    let subImgFileIds: string[] | null = null;
    let subImageEntities: SubImgProductEntity[] = product.subImages;
    const rollbackFileIds: string[] = [];
    const deleteFileIds: string[] = []; // Mảng lưu fileId/URL cần xóa sau commit

    // Bắt đầu transaction
    const queryRunner =
      this.productRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Xử lý ảnh chính (nếu có ảnh mới)
      if (image) {
        const result = await this.mediaService.uploadFile(
          image,
          'product-image',
        );
        if (!result?.fileData?.url || !result?.fileData?.fileId) {
          throw new BadRequestException(
            'Upload ảnh chính thất bại: Dữ liệu trả về không hợp lệ',
          );
        }
        imageUrl = result.fileData.url;
        imgFileId = result.fileData.fileId;
        rollbackFileIds.push(imgFileId);

        // Thêm logic xóa ảnh chính cũ: Lưu URL/fileId cũ vào deleteFileIds
        if (product.image) {
          deleteFileIds.push(product.image); // Giả định image là URL hoặc fileId
        }
      }

      // Xử lý ảnh phụ (nếu có ảnh phụ mới)
      if (subImages && subImages.length > 0) {
        const result = await this.mediaService.uploadFiles(
          subImages,
          'subImages',
        );
        const uploadedFiles = result.map((fileData) => {
          if (!fileData?.fileData?.url || !fileData?.fileData?.fileId) {
            throw new BadRequestException(
              'Upload ảnh phụ thất bại: Dữ liệu trả về không hợp lệ',
            );
          }
          return {
            url: fileData.fileData.url,
            fileId: fileData.fileData.fileId,
          };
        });
        subImagesData = uploadedFiles.map((img) => img.url);
        subImgFileIds = uploadedFiles.map((img) => img.fileId);
        rollbackFileIds.push(...subImgFileIds);

        // Thêm logic xóa ảnh phụ cũ: Lưu URL của ảnh phụ cũ vào deleteFileIds
        deleteFileIds.push(...product.subImages.map((img) => img.url));

        // Tạo entities mới cho ảnh phụ
        subImageEntities = subImagesData.map((url) => {
          const sub = new SubImgProductEntity();
          sub.url = url;
          return sub;
        });
      }

      // Cập nhật sản phẩm trong transaction
      const updatedProduct = queryRunner.manager.create(ProductsEntity, {
        ...product,
        ...validate,
        categoryIds: categoryIds.map((id) => ({ id })),
        image: imageUrl,
        isActive: product.isActive != null ? !!product.isActive : undefined,
        final_price: priceAfterDiscount,
        brand: { id: brandId },
        editorId: user.id,
      });

      const savedProduct = await queryRunner.manager.save(
        ProductsEntity,
        updatedProduct,
      );

      // Xóa ảnh phụ cũ trong transaction (nếu có ảnh phụ mới)
      if (subImages && subImages.length > 0) {
        await queryRunner.manager.delete(SubImgProductEntity, {
          product: { id: product.id },
        });
        // Gán quan hệ product cho ảnh phụ mới và lưu
        subImageEntities.forEach((subImg) => {
          subImg.product = savedProduct;
        });
        await queryRunner.manager.save(SubImgProductEntity, subImageEntities);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Thêm logic xóa file ảnh cũ sau khi commit thành công
      if (deleteFileIds.length > 0) {
        await this.mediaService
          .deleteMultipleFiles(deleteFileIds)
          .catch((err) => {
            Logger.error('Xóa file ảnh cũ thất bại:', err);
            // Không ném lỗi để tránh ảnh hưởng đến kết quả cập nhật, chỉ log
          });
      }

      // Truy vấn lại sản phẩm với các quan hệ
      return await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['brand', 'categoryIds', 'subImages'],
      });
    } catch (error) {
      // Rollback transaction
      await queryRunner.rollbackTransaction();

      // Rollback file ảnh mới (nếu có)
      if (rollbackFileIds.length > 0) {
        await this.mediaService.rollbackFile(rollbackFileIds).catch((err) => {
          Logger.error('Rollback files failed:', err);
          throw new BadRequestException('Rollback file thất bại');
        });
      }

      throw new BadRequestException(`Cập nhật sản phẩm thất bại: ${error}`);
    } finally {
      // Giải phóng queryRunner
      await queryRunner.release();
    }
  }

  async checkProductIds(productIds: number[]): Promise<boolean> {
    if (productIds.length === 0) {
      return false;
    }
    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
        isActive: true,
        deletedAt: null,
      },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
    }
    return true;
  }
}
