import { PartialType } from '@nestjs/swagger';
import { CreateBrandDto } from './create.brand';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
