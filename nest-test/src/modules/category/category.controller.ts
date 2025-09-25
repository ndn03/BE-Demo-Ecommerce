import {
  Controller,
  HttpCode,
  Post,
  HttpStatus,
  Body,
  Get,
  Param,
  Query,
  Patch,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { CategoriesService } from './category.service';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import { ERole } from '@src/configs/role.config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/create.category';
import { User } from '@src/entities/user.entity';
import { QueryCategoryDto } from './dto/query.category';
import { UpdateCategoryDto } from './dto/update.category';
@ApiTags('category')
@Controller('v1/categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Post('create-category')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create category' })
  @HttpCode(HttpStatus.OK)
  async createCategory(
    @AuthUser() user: User,
    @Body() body: CreateCategoryDto,
  ) {
    const newCategory = await this.service.createCategory(body, user);
    return { message: 'Category created successfully', data: newCategory };
  }

  @Get('list-categories')
  @ApiOperation({ summary: 'List categories' })
  @HttpCode(HttpStatus.OK)
  async listCategories(@Query() query: QueryCategoryDto) {
    const { data, total } = await this.service.findAll(query);
    return {
      message: 'Categories retrieved successfully',
      data,
      total,
      // limit: query.limit || 10,
      // page: query.page || 1,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @HttpCode(HttpStatus.OK)
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.service.findOne(id, false, true);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return { message: 'Category retrieved successfully', data: category };
  }

  @Patch(':id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({ summary: 'Update category by ID' })
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @AuthUser() user: User,
    @Param('id') id: number,
    @Body() body: UpdateCategoryDto,
  ) {
    const updatedCategory = await this.service.update(id, body, user);
    return { message: 'Category updated successfully', data: updatedCategory };
  }

  @Delete('soft-remove/:id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({ summary: 'Soft remove category by ID' })
  @HttpCode(HttpStatus.OK)
  async softRemoveCategory(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    const category = await this.service.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    await this.service.update(id, {}, user);
    await this.service.softDelete(+id);
    return { message: 'Category soft removed successfully' };
  }

  @Patch('restore/:id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({ summary: 'Restore category by ID' })
  @HttpCode(HttpStatus.OK)
  async restoreCategory(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    const category = await this.service.findOne(id, true); // ✅ withDeleted = true
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    if (!category.deletedAt) {
      throw new BadRequestException('Category is not soft-deleted');
    }
    // Restore first so that update() can find the record (it excludes soft-deleted rows)
    await this.service.restore(id);
    // Optionally record the editor who performed the restore
    await this.service.update(id, {}, user);
    return { message: 'Category restored successfully' };
  }

  @Delete('delete/:id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({ summary: 'Delete category by ID' })
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    const category = await this.service.findOne(id, true); // ✅ withDeleted = true
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    await this.service.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
