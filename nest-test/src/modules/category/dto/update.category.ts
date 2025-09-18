import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create.category';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
