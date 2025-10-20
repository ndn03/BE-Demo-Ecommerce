import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { validateDto } from '@src/common/utils/validation.util';

// Entities
import { CartEntity } from 'src/entities/cart.entity';
import { CartItemEntity } from 'src/entities/cart-item.entity';
import { User } from '@src/entities/user.entity';
import { VoucherEntity } from '@src/entities/voucher.entity';

// DTOs
import { AddCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update.cart.dto';

// Services
import { ProductService } from './../product/product.service';
import { UserService } from 'src/modules/user/user.service';
import { VoucherService } from '../voucher/voucher.service';

// Types
import { ETypeDiscount } from '@src/common/type.common';

/**
 * 🛒 **Cart Service - Quản lý giỏ hàng**
 *
 * **Chức năng chính:**
 * - Thêm/xóa/cập nhật sản phẩm trong giỏ hàng
 * - Áp dụng voucher với validation business logic
 * - Tính toán tổng giá trị đơn hàng
 * - Quản lý lifecycle của cart
 *
 * **Business Rules:**
 * - Mỗi user chỉ có 1 cart active
 * - CartItem quantity phải > 0
 * - Voucher validation (min order, usage limits)
 * - Price calculation với discount logic
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    private readonly productService: ProductService,
    private readonly userService: UserService,
    private readonly voucherService: VoucherService,
  ) {}

  /**
   * 🛒 **Thêm sản phẩm vào giỏ hàng**
   *
   * **Luồng xử lý:**
   * 1. Validate input data
   * 2. Get hoặc tạo cart cho user
   * 3. Validate product availability
   * 4. Check existing item trong cart
   * 5. Add new hoặc update existing item
   * 6. Recalculate cart total
   *
   * **Business Rules:**
   * - Quantity phải > 0
   * - Product phải active và available
   * - Update quantity nếu product đã có trong cart
   * - Price snapshot tại thời điểm add
   */
  async addToCart(user: User, addCartDto: AddCartDto): Promise<CartEntity> {
    const validatedDto = await validateDto(addCartDto, AddCartDto);

    if (validatedDto.quantity <= 0) {
      throw new BadRequestException('Số lượng sản phẩm phải lớn hơn 0');
    }

    // 🛒 **PHASE 2: GET CART** - Lấy hoặc tạo cart cho user
    const cart = await this.getOrCreateCart(user);

    // 🎯 **PHASE 3: PRODUCT VALIDATION** - Validate sản phẩm
    const product = await this.productService.findOne(validatedDto.productIds);
    if (!product) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm với ID: ${validatedDto.productIds}`,
      );
    }
    if (!product.isActive) {
      throw new BadRequestException('Sản phẩm hiện không khả dụng');
    }

    // 📦 **PHASE 4: CART ITEM HANDLING** - Xử lý cart item
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 Tìm existing item trong cart
      let existingItem = cart.items?.find(
        (item) => item.product.id === validatedDto.productIds,
      );

      if (existingItem) {
        // 🔄 **UPDATE EXISTING ITEM** - Cập nhật số lượng
        existingItem.quantity += validatedDto.quantity;
        existingItem.price = product.final_price; // Update price hiện tại
        await manager.save(CartItemEntity, existingItem);

        this.logger.log(
          `Updated cart item: Product ${validatedDto.productIds}, new quantity: ${existingItem.quantity}`,
        );
      } else {
        // ➕ **ADD NEW ITEM** - Tạo mới cart item
        const newItem = manager.create(CartItemEntity, {
          cart: cart,
          product: product,
          quantity: validatedDto.quantity,
          price: product.final_price, // Snapshot price tại thời điểm add
        });

        const savedItem = await manager.save(CartItemEntity, newItem);
        cart.items = cart.items || [];
        cart.items.push(savedItem);

        this.logger.log(
          `Added new cart item: Product ${validatedDto.productIds}, quantity: ${validatedDto.quantity}`,
        );
      }

      // 💰 **PHASE 5: RECALCULATE TOTAL** - Tính lại tổng giá trị
      const updatedCart = await this.recalculateCartTotal(cart, manager);

      this.logger.log(
        `Cart updated for user ${user.id}, new total: ${updatedCart.totalPrice}`,
      );
      return updatedCart;
    });
  }

  /**
   * 🛒 **Lấy hoặc tạo cart cho user**
   *
   * **Logic:**
   * - Tìm existing cart của user
   * - Tạo mới nếu chưa có
   * - Load đầy đủ relations (items, products, voucher)
   */
  private async getOrCreateCart(user: User): Promise<CartEntity> {
    // 🔍 Tìm existing cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product', 'voucher', 'user'],
    });

    // 🆕 Tạo mới nếu chưa có
    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        items: [],
        totalPrice: 0,
      });
      cart = await this.cartRepository.save(cart);
      this.logger.log(`Created new cart for user ${user.id}`);
    }

    return cart;
  }

  /**
   * 💰 **Tính lại tổng giá trị cart**
   *
   * **Logic:**
   * - Tính subtotal từ tất cả items
   * - Áp dụng voucher discount (nếu có)
   * - Update cart.totalPrice
   * - Save và return updated cart
   */
  private async recalculateCartTotal(
    cart: CartEntity,
    manager?: EntityManager,
  ): Promise<CartEntity> {
    const entityManager = manager || this.cartRepository.manager;

    // 🧮 Tính subtotal từ tất cả cart items
    const subtotal =
      cart.items?.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0) || 0;

    // 💰 Start với subtotal
    let finalTotal = subtotal;

    // 🎫 Áp dụng voucher discount nếu có
    if (cart.voucher) {
      finalTotal = await this.applyVoucherDiscount(subtotal, cart.voucher);
    }

    // 💾 Update cart total
    cart.totalPrice = Math.max(0, finalTotal); // Không để âm

    const updatedCart = await entityManager.save(CartEntity, cart);
    return updatedCart;
  }

  /**
   * 🎫 **Áp dụng voucher discount vào giá tiền**
   *
   * **Logic:**
   * - Check voucher có active không
   * - Check valid date range
   * - Apply percent hoặc fixed discount
   * - Apply minimum order amount
   */
  private async applyVoucherDiscount(
    subtotal: number,
    voucher: VoucherEntity,
  ): Promise<number> {
    if (!voucher.isActive) {
      this.logger.warn(`Voucher ${voucher.id} is not active`);
      return subtotal;
    }

    // 📅 Date validation giờ được handle ở VoucherService.checkVoucher()
    // Không cần check validFrom/validTo ở đây nữa vì đã được validate trước đó

    // 💵 Check minimum order amount
    if (voucher.min_order_value && subtotal < voucher.min_order_value) {
      this.logger.warn(
        `Order amount ${subtotal} below minimum ${voucher.min_order_value} for voucher ${voucher.id}`,
      );
      return subtotal;
    }

    // 🧮 Calculate discount
    let discount = 0;

    if (
      voucher.discount_type === ETypeDiscount.PERCENTAGE &&
      voucher.value_discount
    ) {
      // 📊 Percent discount
      discount = (subtotal * voucher.value_discount) / 100;

      // 🧢 Apply max discount limit
      if (voucher.max_discount_value && discount > voucher.max_discount_value) {
        discount = voucher.max_discount_value;
      }
    } else if (
      voucher.discount_type === ETypeDiscount.AMOUNT &&
      voucher.value_discount
    ) {
      // 💰 Fixed amount discount
      discount = voucher.value_discount;
    }
    const finalAmount = subtotal - discount;
    this.logger.log(
      `Applied voucher ${voucher.id}: subtotal ${subtotal} - discount ${discount} = ${finalAmount}`,
    );

    return Math.max(0, finalAmount); // Không để âm
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

    // Tính tổng giá trị giỏ hàng
    const totalPrice =
      cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0;

    return { cart, totalPrice };
  }

  /**
   * ✏️ **Cập nhật quantity của cart item**
   *
   * **Logic:**
   * - Tìm item trong cart
   * - Update quantity hoặc remove nếu quantity = 0
   * - Recalculate total
   * - Save và return updated cart
   */
  async updateCartItem(
    user: User,
    updateDto: UpdateCartDto,
  ): Promise<CartEntity> {
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET CART** - Lấy cart hiện tại
      const cart = await this.getOrCreateCart(user);

      // 🔎 **PHASE 2: FIND ITEM** - Tìm item cần update
      const item = cart.items?.find((item) => item.id === updateDto.itemId);
      if (!item) {
        throw new NotFoundException(
          `Cart item với ID ${updateDto.itemId} không tồn tại`,
        );
      }

      // ✏️ **PHASE 3: UPDATE OR REMOVE** - Update hoặc remove item
      if (updateDto.quantity <= 0) {
        // 🗑️ Remove item nếu quantity <= 0
        await manager.remove(CartItemEntity, item);
        cart.items = cart.items.filter((i) => i.id !== item.id);
        this.logger.log(`Removed item ${item.id} from cart ${cart.id}`);
      } else {
        // ✏️ Update quantity
        item.quantity = updateDto.quantity;
        await manager.save(CartItemEntity, item);
        this.logger.log(
          `Updated item ${item.id} quantity to ${updateDto.quantity}`,
        );
      }

      // 💰 **PHASE 4: RECALCULATE TOTAL** - Tính lại tổng tiền
      const updatedCart = await this.recalculateCartTotal(cart, manager);

      this.logger.log(
        `Cart ${cart.id} updated, new total: ${updatedCart.totalPrice}`,
      );
      return updatedCart;
    });
  }

  /**
   * 🗑️ **Xóa item khỏi cart**
   *
   * **Logic:**
   * - Tìm và remove item
   * - Recalculate total
   * - Return updated cart
   */
  async removeFromCart(user: User, itemId: number): Promise<CartEntity> {
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET CART** - Lấy cart hiện tại
      const cart = await this.getOrCreateCart(user);

      // 🔎 **PHASE 2: FIND & REMOVE ITEM** - Tìm và xóa item
      const item = cart.items?.find((item) => item.id === itemId);
      if (!item) {
        throw new NotFoundException(`Cart item với ID ${itemId} không tồn tại`);
      }

      await manager.remove(CartItemEntity, item);
      cart.items = cart.items.filter((i) => i.id !== itemId);

      // 💰 **PHASE 3: RECALCULATE TOTAL** - Tính lại tổng tiền
      const updatedCart = await this.recalculateCartTotal(cart, manager);

      this.logger.log(`Removed item ${itemId} from cart ${cart.id}`);
      return updatedCart;
    });
  }

  /**
   * 🧹 **Xóa toàn bộ cart**
   *
   * **Logic:**
   * - Remove tất cả cart items
   * - Reset cart totalPrice = 0
   * - Return empty cart
   */
  async clearCart(user: User): Promise<CartEntity> {
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET CART** - Lấy cart hiện tại
      const cart = await this.getOrCreateCart(user);

      // 🗑️ **PHASE 2: REMOVE ALL ITEMS** - Xóa tất cả items
      if (cart.items && cart.items.length > 0) {
        await manager.remove(CartItemEntity, cart.items);
        cart.items = [];
      }

      // 💰 **PHASE 3: RESET TOTAL** - Reset tổng tiền
      cart.totalPrice = 0;
      cart.voucher = null; // Remove voucher cũ

      const clearedCart = await manager.save(CartEntity, cart);
      this.logger.log(`Cleared all items from cart ${cart.id}`);

      return clearedCart;
    });
  }

  /**
   * 🎫 **Áp dụng voucher vào cart**
   *
   * **Logic:**
   * - Validate voucher code
   * - Check voucher conditions
   * - Apply voucher và recalculate total
   * - Save updated cart
   */
  async applyVoucher(user: User, voucherCode: string): Promise<CartEntity> {
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET CART** - Lấy cart hiện tại
      const cart = await this.getOrCreateCart(user);

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException(
          'Giỏ hàng trống, không thể áp dụng voucher',
        );
      }

      // 🔎 **PHASE 2: FIND VOUCHER** - Tìm voucher theo code
      const foundVoucher = await manager.findOne(VoucherEntity, {
        where: { code: voucherCode },
      });

      if (!foundVoucher) {
        throw new NotFoundException(
          `Voucher với mã ${voucherCode} không tồn tại`,
        );
      }

      // ✅ **PHASE 3: VALIDATE VOUCHER** - Kiểm tra điều kiện và sản phẩm
      const productIds = cart.items.map((item) => item.product.id);

      // Sử dụng VoucherService.checkVoucher để validate voucher và product applicability
      const validatedVoucher = await this.voucherService.checkVoucher(
        foundVoucher.id,
        productIds,
      );

      // 🎫 **PHASE 4: APPLY VOUCHER** - Áp dụng voucher
      cart.voucher = validatedVoucher;
      const updatedCart = await this.recalculateCartTotal(cart, manager);

      this.logger.log(`Applied voucher ${voucherCode} to cart ${cart.id}`);
      return updatedCart;
    });
  }

  async removeVoucher(user: User): Promise<CartEntity> {
    return await this.cartRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET CART** - Lấy cart hiện tại
      const cart = await this.getOrCreateCart(user);

      if (!cart.voucher) {
        throw new BadRequestException('Giỏ hàng chưa có mã giảm giá nào');
      }
      cart.voucher = null;
      const updatedCart = await this.recalculateCartTotal(cart, manager);

      this.logger.log(`Removed voucher from cart ${cart.id}`);
      return updatedCart;
    });
  }

}
