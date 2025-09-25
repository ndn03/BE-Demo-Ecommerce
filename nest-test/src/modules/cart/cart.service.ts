import { UserService } from 'src/modules/user/user.service';
import { ProductService } from './../product/product.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartEntity } from 'src/entities/cart.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from '@src/entities/user.entity';
import { AddCartDto } from './dto/add-to-cart.dto';
import { validateDto } from '@src/common/utils/validation.util';
import { UpdateCartDto } from './dto/update.cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    private readonly productService: ProductService,
  ) {}

  async addToCart(user: User, body: AddCartDto): Promise<CartEntity> {
    const validatedDto = await validateDto(body, AddCartDto);

    // const productIds = (validatedDto.productIds || [])
    //   .map((id) => Number(id))
    //   .filter(Boolean);
    // const products = await this.productService.checkProductIds(productIds);
    // if (!products) {
    //   throw new Error('Một hoặc nhiều sản phẩm không hợp lệ');
    // }

    const { cart } = await this.getCartByUser(user);

    const productId = validatedDto.productIds;
    if (productId) {
      const product = await this.productService.findOne(productId);
      if (!product) {
        throw new Error(`Sản phẩm với ID ${productId} không tồn tại`);
      }

      let item = cart.items?.find((i) => i.product.id === productId);
      if (item) {
        // Nếu đã có trong giỏ, cập nhật số lượng
        item.quantity += validatedDto.quantity;
        item.price = product.final_price;
      } else {
        // Nếu chưa có, tạo mới
        item = this.cartRepository.manager.create('CartItemEntity', {
          product,
          quantity: validatedDto.quantity,
          price: product.final_price,
          cart,
        });
        cart.items.push(item);
      }
    }

    // if (validatedDto.voucher) {
    //   const voucher = await this.cartRepository.manager.findOne(
    //     'VoucherEntity',
    //     {
    //       where: { id: validatedDto.voucher },
    //     },
    //   );
    //   if (!voucher) {
    //     throw new Error('Voucher không hợp lệ');
    //   }
    //   cart.voucher = voucher;
    // }

    await this.cartRepository.save(cart);
    return cart;
  }

  async getCartByUser(
    user: User,
  ): Promise<{ cart: CartEntity; totalPrice: number }> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product', 'voucher'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ user, items: [] });
      await this.cartRepository.save(cart);
    }

    // let price = cart.totalPrice;
    // if (body.discount_type) {
    //   if (body.discount_type == ETypeDiscount.PERCENTAGE) {
    //     if (body.discount > 100 || body.discount <= 0) {
    //       throw new BadRequestException('Giá trị giảm giá không hợp lệ');
    //     }
    //     price = price - (price * body.discount) / 100;
    //   }
    //   if (body.discount_type == ETypeDiscount.AMOUNT) {
    //     if (body.discount <= 0) {
    //       throw new BadRequestException('Giá trị giảm giá không hợp lệ');
    //     }
    //     price = price - body.discount;
    //   }
    // }

    // Tính tổng giá trị giỏ hàng
    const totalPrice =
      cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0;

    return { cart, totalPrice };
  }

  async updateCartItem(user: User, body: UpdateCartDto): Promise<CartEntity> {
    const { cart } = await this.getCartByUser(user);
    const item = cart.items.find((i) => i.id === body.productIds);
    if (!item) {
      throw new Error('Mục trong giỏ hàng không tồn tại');
    }
    if (body.quantity <= 0) {
      // Xóa mục nếu số lượng <= 0
      cart.items = cart.items.filter((i) => i.id !== item.id);
      await this.cartRepository.manager.delete('CartItemEntity', item.id);
    } else {
      item.quantity = body.quantity;
    }
    await this.cartRepository.save(cart);
    return cart;
  }

  async deleteCartItem(user: User, itemId: number): Promise<CartEntity> {
    const { cart } = await this.getCartByUser(user);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Mục trong giỏ hàng không tồn tại');
    }
    cart.items = cart.items.filter((i) => i.id !== itemId);
    await this.cartRepository.manager.delete('CartItemEntity', itemId);
    await this.cartRepository.save(cart);
    return cart;
  }

  async clearCart(user: User): Promise<CartEntity> {
    const { cart } = await this.getCartByUser(user);
    if (cart.items.length > 0) {
      const itemIds = cart.items.map((i) => i.id);
      await this.cartRepository.manager.delete('CartItemEntity', itemIds);
      cart.items = [];
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  // async caculateTotalPrice(user: User): Promise<number> {
  //   const { totalPrice, cart } = await this.getCartByUser(user);
  //   if (cart.voucher) {
  //     const voucher = await this.cartRepository.manager.findOne(
  //       'VoucherEntity',
  //       {
  //         where: { id: cart.voucher.id },
  //       },
  //     );
  //     if (voucher) {
  //       totalPrice -= (totalPrice * voucher.discount) / 100;
  //     }
  //   }
  //   return totalPrice;
  // }
}
