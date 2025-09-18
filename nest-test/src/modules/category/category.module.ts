import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './category.controller';
import { CategoryEntity } from 'src/entities/categories.entity';
import { CategoriesService } from './category.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [CategoriesService],
  controllers: [CategoriesController],
})
export class CategoryModule {}
