import { PartialType } from '@nestjs/swagger';
import { AddCartDto } from './add-to-cart.dto';

export class UpdateCartDto extends PartialType(AddCartDto) {}
