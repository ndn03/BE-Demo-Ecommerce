// import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BrandsEntity } from 'src/entities/brands.entity';
import { BaseService } from '@src/common/services/base.service';
import { Brackets, Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create.brand';
import { User } from '@src/entities/user.entity';
import { validateDto } from 'src/common/utils/validation.util';
import { EBrand } from './brand.interface';
import { EOrder } from '@src/common/type.common';
import { UpdateBrandDto } from './dto/update.brand';
import { MediaService } from '../upload/media.service';
import { checkDuplicateByField } from 'src/common/context/helper/check-field-duplicate';
import { QueryBrandDto } from './dto/query.brand';
import { FileUploadHelper } from '../upload/helpers/file-upload';
import { ALLOWED_MIME_TYPES_FOR_IMAGE } from '@src/configs/const.config';

@Injectable()
export class BrandsService extends BaseService<BrandsEntity> {
  constructor(
    @InjectRepository(BrandsEntity)
    private readonly brandRepository: Repository<BrandsEntity>,
    private readonly mediaService: MediaService,
  ) {
    super(brandRepository);
  }

  async uploadLogo(
    file: Express.Multer.File,
  ): Promise<{ url: string; fileId: string } | null> {
    if (!file) {
      return null;
    }

    try {
      // Validate file trước khi upload
      FileUploadHelper.validationFileBeforeUpload(
        file,
        ALLOWED_MIME_TYPES_FOR_IMAGE,
      );

      // Upload file logo qua MediaService
      const result = await this.mediaService.uploadFile(file, 'brands-logos');

      // Trả về thông tin file
      return {
        url: result.fileData.url,
        fileId: result.fileData.fileId,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload logo: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async createBrand(
    body: CreateBrandDto,
    user: User,
    logoFile?: Express.Multer.File,
  ): Promise<BrandsEntity> {
    // Xác thực dữ liệu từ DTO
    const validatedDto = await validateDto(body, CreateBrandDto);

    // Loại bỏ trường logo vì nó được xử lý riêng (có thể tối ưu bằng DTO)
    delete validatedDto.logo;

    // Kiểm tra trùng lặp tên thương hiệu
    if (validatedDto.name) {
      const isDuplicate = await checkDuplicateByField(
        this.brandRepository,
        'name',
        validatedDto.name,
        {
          alias: 'brand',
          withDeleted: false,
          idColumn: 'id',
        },
      );

      if (isDuplicate) {
        throw new BadRequestException({
          message: 'Tên thương hiệu đã tồn tại',
        });
      }
    }

    let logoUrl: string | null = null;
    let fileId: string | null = null;

    try {
      // Chỉ upload logo nếu có tệp
      if (logoFile) {
        const uploadResult = await this.uploadLogo(logoFile);
        // Kiểm tra và gán giá trị từ uploadResult
        if (
          uploadResult &&
          typeof uploadResult === 'object' &&
          'url' in uploadResult &&
          'fileId' in uploadResult
        ) {
          logoUrl = uploadResult.url;
          fileId = uploadResult.fileId;
        } else {
          console.warn('Kết quả upload không hợp lệ, bỏ qua logo.');
        }
      }

      // Tạo entity mới với dữ liệu từ DTO và logo (nếu có)
      const newBrand = this.brandRepository.create({
        ...validatedDto,
        logo: logoUrl, // Gán logoUrl hoặc null nếu không có
        creatorId: user.id,
      });

      // Lưu và trả về entity
      return await this.brandRepository.save(newBrand);
    } catch (error) {
      // Rollback tệp nếu đã upload nhưng xảy ra lỗi
      if (fileId) {
        await this.mediaService
          .rollbackFile([fileId])
          .catch((rollbackError) => {
            console.error(`Không thể rollback tệp ${fileId}:`, rollbackError);
          });
      }
      throw error; // Ném lỗi để controller xử lý
    }
  }

  async findAll(
    query: QueryBrandDto,
  ): Promise<{ data: BrandsEntity[]; total: number }> {
    const queryDto = await validateDto(query, QueryBrandDto);
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EBrand.name,
      search,
      isDeleted = 0,
      withDeleted,
      isPagination = 1,
      isActive,
      name,
      description,
      country,
      creatorId,
    } = queryDto;

    const inIds = queryDto?.['inIds[]'];
    const notInIds = queryDto?.['notInIds[]'];

    const qb = this.brandRepository.createQueryBuilder('brand');
    // qb.leftJoin('user.profile', 'profile').addSelect([
    //   'profile.id',
    //   'profile.fullName',
    // ]);
    // [VN] Cột logo có select: false trong entity, thêm addSelect để đảm bảo luôn có dữ liệu logo khi cần hiển thị/log
    qb.addSelect(['brand.logo']);
    qb.leftJoin('brand.creator', 'user').addSelect(['user.id']);

    qb.leftJoinAndSelect('brand.products', 'product');
    if (search) {
      qb.andWhere(
        new Brackets((qbs) => {
          qbs
            .where('LOWER(brand.name) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(brand.description) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(brand.country) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            });
        }),
      );
    }
    if (name) {
      qb.andWhere('LOWER(brand.name) LIKE LOWER(:name)', {
        name: `%${name.toLowerCase()}%`,
      });
    }
    if (typeof isActive !== 'undefined') {
      qb.andWhere('brand.isActive = :isActive', { isActive });
    }

    if (description) {
      qb.andWhere('LOWER(brand.description) LIKE LOWER(:description)', {
        description: `%${description.toLowerCase()}%`,
      });
    }
    if (creatorId) {
      qb.andWhere('brand.creatorId = :creatorId', { creatorId });
    }

    if (inIds?.length > 0) {
      qb.andWhere('brand.id IN (:...ids)', { ids: inIds });
    }

    if (notInIds?.length > 0) {
      qb.andWhere('brand.id NOT IN (:...notInIds)', { notInIds });
    }

    if (country)
      qb.andWhere('LOWER(brand.country) LIKE LOWER(:country)', {
        country: `%${country.toLowerCase()}%`,
      });

    if (withDeleted) {
      qb.withDeleted();
      if (isDeleted !== undefined) {
        qb.andWhere(
          isDeleted ? 'brand.deletedAt IS NOT NULL' : 'brand.deletedAt IS NULL',
        );
      }
    }
    // qb.skip((page - 1) * limit).take(limit);
    qb.orderBy(`brand.${orderBy}`, order);
    if (isPagination === 1) {
      const skip = (page - 1) * limit;
      qb.skip(skip).take(limit);
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
    };
  }

  async findOne(
    id: number,
    withDeleted: boolean = false,
    isActive?: boolean,
  ): Promise<BrandsEntity> {
    const qb = this.brandRepository.createQueryBuilder('brands');
    if (withDeleted) qb.withDeleted();

    // [VN] Cột logo có select: false trong entity, cần addSelect để lấy ra giá trị logo
    qb.addSelect(['brands.logo']);
    qb.where('brands.id = :id', { id });

    //check isActive
    if (isActive != null) {
      qb.andWhere('brands.isActive = :isActive', { isActive });
    }
    const brand = await qb.getOne();
    if (!brand) {
      throw new NotFoundException({
        message: 'Brand not found',
      });
    }
    return brand;
  }

  async update(
    id: number,
    body: UpdateBrandDto,
    user: User,
    logoFile?: Express.Multer.File,
  ): Promise<BrandsEntity> {
    const validate = await validateDto(body, UpdateBrandDto);
    const brand = await this.findOne(id, false);
    if (!brand) {
      throw new NotFoundException({ message: 'Brand not found' });
    }
    // Xác định URL và fileId của logo cũ (nếu có) để xóa sau khi upload thành công logo mới
    const oldlogoUrl = brand.logo;
    //lấy UUID từ URL nếu có dạng CDN (Uploadcare). Nếu logo đã là UUID thì dùng trực tiếp.
    const oldFileId = (() => {
      if (!oldlogoUrl) return null;
      // Nếu là URL -> tách phần giống UUID
      if (oldlogoUrl.includes('/')) {
        const parts = oldlogoUrl.split('/');
        const found = parts.find((p) => p && p.includes('-') && p.length >= 32);
        return found ?? parts.filter(Boolean).pop() ?? null;
      }
      // Nếu không phải URL trả về chuỗi gốc (có thể là UUID)
      return oldlogoUrl;
    })();
    // console.log('🛈 [Brand.update] Old logo URL:', oldlogoUrl);
    // console.log('🛈 [Brand.update] Old logo fileId:', oldFileId);
    // Kiểm tra tên trùng lặp
    if (validate.name) {
      const isDuplicate = await checkDuplicateByField(
        this.brandRepository,
        'name',
        validate.name,
        {
          alias: 'brand',
          excludeId: id,
          withDeleted: false,
        },
      );

      if (isDuplicate) {
        throw new BadRequestException({
          message: 'Tên thương hiệu đã tồn tại',
        });
      }
    }

    // Upload logo mới nếu có
    let logoUrl: string | null = brand.logo;
    let fileId: string | null = null;

    try {
      if (logoFile) {
        // [VN] Nếu brand hiện tại đã có logo, xóa logo cũ trước khi cập nhật logo mới để tránh rác.
        if (brand.logo) {
          try {
            // [VN] Gọi MediaService.deleteFile để xóa logo hiện tại (hỗ trợ cả URL hoặc UUID)
            await this.mediaService.deleteFile(oldFileId ?? brand.logo);
          } catch {
            throw new BadRequestException('❌ Lỗi khi xóa logo hiện tại:');
          }
        }
        // [VN] Upload logo mới lên MediaService (ví dụ: Uploadcare, S3, Cloudinary, ...)
        const result = await this.mediaService.uploadFile(
          logoFile,
          'brands-logos', // [VN] Thư mục/bucket/collection để chứa logo của brand
        );
        // [VN] Lưu URL và fileId trả về để cập nhật DB và phục vụ rollback nếu cần
        logoUrl = result.fileData.url;
        fileId = result.fileData.fileId;
      }
      // [VN] Cập nhật brand với logo URL mới (nếu có) và các trường khác
      Object.assign(brand, {
        ...validate,
        logo: logoUrl,
        editorId: user.id,
      });

      return this.brandRepository.save(brand);
    } catch (error) {
      // Rollback nếu có lỗi và đã upload file
      if (fileId) {
        const fileIdsToDelete: string[] = [fileId];
        await this.mediaService.rollbackFile(fileIdsToDelete).catch(() => {
          console.error(`Failed to rollback file ${fileId}`);
        });
      }

      throw error;
    }
  }
}
