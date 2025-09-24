import { validateDto } from '@src/common/utils/validation.util';
import { BaseService } from 'src/common/services/base.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VoucherEntity } from './voucher.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreateVoucherDto } from './dto/create.voucher.dto';
import { CategoryEntity } from '@src/entities/categories.entity';
import { BrandsEntity } from '@src/entities/brands.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { User } from '@src/entities/user.entity';
import { CategoriesService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { BrandsService } from './../brand/brand.service';
import * as dayjs from 'dayjs';

@Injectable()
export class VoucherService extends BaseService<VoucherEntity> {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(BrandsEntity)
    private readonly brandRepository: Repository<BrandsEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly CategoriesService: CategoriesService,
    private readonly BrandsService: BrandsService,
    private readonly ProductService: ProductService,
    @InjectRepository(ProductsEntity)
    private readonly productRepository: Repository<ProductsEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(voucherRepository);
  }

  async createVoucher(
    user: User,
    data: CreateVoucherDto,
  ): Promise<VoucherEntity> {
    const body = await validateDto(data, CreateVoucherDto);

    const brandIds = (body.brandsIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    if (brandIds.length > 0) {
      const checkBrand = await this.BrandsService.checkBrandIds(brandIds);
      if (!checkBrand) {
        throw new BadRequestException(
          'Một hoặc nhiều thương hiệu không tồn tại',
        );
      }
    }

    const categoryIds = (body.categoriesIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    if (categoryIds.length > 0) {
      const checkCategory =
        await this.CategoriesService.checkCategoryIds(categoryIds);
      if (!checkCategory) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
      }
    }
    const productIds = (body.productsIds || [])
      .map((id) => Number(id))
      .filter(Boolean);
    if (productIds.length > 0) {
      const checkProduct =
        await this.ProductService.checkProductIds(productIds);
      if (!checkProduct) {
        throw new BadRequestException('Một hoặc nhiều sản phẩm không tồn tại');
      }
    }

    
    return;
  }
}
