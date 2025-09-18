// import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/entities/categories.entity';
import { BaseService } from '@src/common/services/base.service';
import { Brackets, In, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create.category';
import { User } from '@src/entities/user.entity';
import { validateDto } from 'src/common/utils/validation.util';
import { QueryCategoryDto } from './dto/query.category';
import { ECategory } from './category.interface';
import { EOrder } from '@src/common/type.common';
import { UpdateCategoryDto } from './dto/update.category';
// import { EOrder } from '@src/common/type.common';
import { checkDuplicateByField } from 'src/common/context/helper/check-field-duplicate';
@Injectable()
export class CategoriesService extends BaseService<CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {
    super(categoryRepository);
  }

  async createCategory(
    body: CreateCategoryDto,
    user: User,
  ): Promise<CategoryEntity> {
    const validatedDto = await validateDto(body, CreateCategoryDto);

    if (validatedDto.name) {
      const isDuplicate = await checkDuplicateByField(
        this.categoryRepository,
        'name',
        validatedDto.name,
        {
          idColumn: 'id',
        },
      );

      if (isDuplicate) {
        throw new BadRequestException('Tên danh mục đã tồn tại!');
      }
    }

    const newCategory = this.categoryRepository.create({
      ...validatedDto,
      creatorId: user.id,
    });

    return this.categoryRepository.save(newCategory);
  }

  async findAll(
    query: QueryCategoryDto,
  ): Promise<{ data: CategoryEntity[]; total: number }> {
    const queryDto = await validateDto(query, QueryCategoryDto);
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = ECategory.name,
      search,
      isDeleted = 0,
      withDeleted,
      isPagination = 1,
      isActive,
      name,
      description,
      creatorId,
    } = queryDto;

    const inIds = queryDto?.['inIds[]'];
    const notInIds = queryDto?.['notInIds[]'];

    const qb = this.categoryRepository.createQueryBuilder('category');
    // qb.leftJoin('user.profile', 'profile').addSelect([
    //   'profile.id',
    //   'profile.fullName',
    // ]);
    qb.leftJoin('category.creator', 'user').addSelect(['user.id']);

    qb.leftJoinAndSelect('category.product', 'product');
    if (search) {
      qb.andWhere(
        new Brackets((qbs) => {
          qbs
            .where('LOWER(category.name) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(category.description) LIKE LOWER(:search)', {
              search: `%${search.toLowerCase()}%`,
            });
        }),
      );
    }
    if (name) {
      qb.andWhere('LOWER(category.name) LIKE LOWER(:name)', {
        name: `%${name.toLowerCase()}%`,
      });
    }
    if (typeof isActive !== 'undefined') {
      qb.andWhere('category.isActive = :isActive', { isActive });
    }

    if (description) {
      qb.andWhere('LOWER(category.description) LIKE LOWER(:description)', {
        description: `%${description.toLowerCase()}%`,
      });
    }
    if (creatorId) {
      qb.andWhere('category.creatorId = :creatorId', { creatorId });
    }

    if (inIds?.length > 0) {
      qb.andWhere('category.id IN (:...ids)', { ids: inIds });
    }

    if (notInIds?.length > 0) {
      qb.andWhere('category.id NOT IN (:...notInIds)', { notInIds });
    }

    if (withDeleted) {
      qb.withDeleted();
      if (isDeleted !== undefined) {
        qb.andWhere(
          isDeleted
            ? 'category.deletedAt IS NOT NULL'
            : 'category.deletedAt IS NULL',
        );
      }
    }
    // qb.skip((page - 1) * limit).take(limit);
    qb.orderBy(`category.${orderBy}`, order);
    if (isPagination === 1) {
      qb.skip((page - 1) * limit).take(limit);
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
  ): Promise<CategoryEntity> {
    const qb = this.categoryRepository.createQueryBuilder('category');
    if (withDeleted) qb.withDeleted();

    qb.where('category.id = :id', { id });

    //check isActive
    if (isActive != null) {
      qb.andWhere('category.isActive = :isActive', { isActive });
    }
    const category = await qb.getOne();
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
      });
    }
    return category;
  }

  async update(
    id: number,
    body: UpdateCategoryDto,
    user: User,
  ): Promise<CategoryEntity> {
    const validate = await validateDto(body, UpdateCategoryDto);

    const category = await this.findOne(id, false);
    if (!category) {
      throw new NotFoundException({ message: 'Category not found' });
    }

    // Check duplicate by name
    if (validate.name) {
      const isDuplicate = await checkDuplicateByField(
        this.categoryRepository,
        'name',
        validate.name,
        {
          alias: 'category',
          excludeId: id,
          withDeleted: false,
          idColumn: 'id',
        },
      );

      if (isDuplicate) {
        throw new BadRequestException({
          message: 'Tên danh mục đã tồn tại',
        });
      }
    }

    Object.assign(category, {
      ...validate,
      editorId: user.id,
    });

    return this.categoryRepository.save(category);
  }

  async checkCategoryIds(categoryIds: number[]): Promise<boolean> {
    if (categoryIds.length === 0) {
      return false;
    }
    const categories = await this.categoryRepository.find({
      where: {
        id: In(categoryIds),
        isActive: true,
        deletedAt: null,
      },
      relations: ['product'],
    });
    if (categories.length !== categoryIds.length) {
      throw new NotFoundException('Một hoặc nhiều danh mục không tồn tại');
    }
    return true;
  }
}
