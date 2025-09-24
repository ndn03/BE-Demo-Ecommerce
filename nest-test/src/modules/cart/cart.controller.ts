import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Delete,
  Patch,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Auth, AuthUser } from '../auth/auth.decorator';
import { AddCartDto } from './dto/add-to-cart.dto';
import { User } from '@src/entities/user.entity';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UpdateCartDto } from './dto/update.cart.dto';

@Controller('v1/cart')
export class CartController {
  constructor(private service: CartService) {}

  @Post('add')
  @Auth()
  @ApiOperation({ summary: 'Create brand' })
  @HttpCode(HttpStatus.OK)
  async addToCart(@AuthUser() user: User, @Body() body: AddCartDto) {
    const result = await this.service.addToCart(user, body);
    return { message: 'Add to cart successfully', data: result };
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get cart' })
  @HttpCode(HttpStatus.OK)
  async getCart(@AuthUser() user: User) {
    const result = await this.service.getCartByUser(user);
    return { message: 'Get cart successfully', data: result };
  }

  @Delete('item/:id')
  @Auth()
  @ApiOperation({ summary: 'Delete item from cart' })
  @HttpCode(HttpStatus.OK)
  async deleteCartItem(@AuthUser() user: User, @Param('id') itemId: number) {
    const result = await this.service.deleteCartItem(user, itemId);
    return { message: 'Delete item from cart successfully', data: result };
  }

  @Delete()
  @Auth()
  @ApiOperation({ summary: 'Clear cart' })
  @HttpCode(HttpStatus.OK)
  async clearCart(@AuthUser() user: User) {
    const result = await this.service.clearCart(user);
    return { message: 'Clear cart successfully', data: result };
  }

  @Patch('item/:id')
  @Auth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  @HttpCode(HttpStatus.OK)
  async updateCartItem(@AuthUser() user: User, @Body() body: UpdateCartDto) {
    const result = await this.service.updateCartItem(user, body);
    return { message: 'Update cart item successfully', data: result };
  }
}
