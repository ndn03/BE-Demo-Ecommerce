import { validateDto } from '@src/common/utils/validation.util';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between } from 'typeorm';

// Entities
import { OrdersEntity } from '@src/entities/order.entity';
import { OrderItemsEntity } from '@src/entities/order.items.entity';
import { User } from '@src/entities/user.entity';
import { VoucherEntity } from '@src/entities/voucher.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { CartEntity } from '@src/entities/cart.entity';
import { CartItemEntity } from '@src/entities/cart-item.entity';

// DTOs
import { CreateOrderDto } from './dto/create-order.dto';
import {
  UpdateOrderStatusDto,
  CreateOrderFromCartDto,
} from './dto/update-order.dto';
import { GetOrdersQueryDto, OrderStatsQueryDto } from './dto/query-order.dto';

// Types & Enums
import { EStatusOrder, ETypeDiscount } from '@src/common/type.common';

// Services
import { ProductService } from '@src/modules/product/product.service';
import { CartService } from '@src/modules/cart/cart.service';
import { VoucherService } from '../voucher/voucher.service';

/**
 * 📦 **Order Service - Quản lý đơn hàng**
 *
 * **Chức năng chính:**
 * - Tạo đơn hàng từ cart hoặc trực tiếp
 * - Quản lý trạng thái đơn hàng
 * - Validation inventory và pricing
 * - Áp dụng voucher discounts
 * - Thống kê đơn hàng
 */
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(OrdersEntity)
    private readonly orderRepository: Repository<OrdersEntity>,

    @InjectRepository(OrderItemsEntity)
    private readonly orderItemRepository: Repository<OrderItemsEntity>,

    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,

    private readonly voucherService: VoucherService,

    @InjectRepository(ProductsEntity)
    private readonly productRepository: Repository<ProductsEntity>,

    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,

    private readonly productService: ProductService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 🛒 **Tạo đơn hàng từ giỏ hàng**
   *
   * **Logic:**
   * - Validate cart có items không
   * - Check inventory availability
   * - Apply voucher discount (nếu có)
   * - Tạo order và order items
   * - Clear cart sau khi tạo order thành công
   * - Cập nhật inventory
   */
  async createOrderFromCart(
    user: User,
    body: CreateOrderFromCartDto,
  ): Promise<OrdersEntity> {
    const validatedData = await validateDto(body, CreateOrderFromCartDto);
    return await this.orderRepository.manager.transaction(async (manager) => {
      // 🔍 **PHASE 1: GET USER CART** - Lấy cart hiện tại của user
      const { cart } = await this.cartService.getCartByUser(user);

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống, không thể tạo đơn hàng');
      }

      // ✅ **PHASE 2: VALIDATE INVENTORY** - Kiểm tra tồn kho
      await this.validateInventoryAvailability(cart.items, manager);

      // 🎫 **PHASE 3: APPLY VOUCHER** - Áp dụng voucher nếu có
      let voucher: VoucherEntity | null = null;
      let voucherDiscount = 0;

      if (validatedData.voucherCode) {
        // Extract product IDs for voucher validation
        const productIds = cart.items.map((item) => item.product.id);

        // Use VoucherService for complete validation including product applicability
        voucher = await this.voucherService.checkVoucher(
          await this.getVoucherIdByCode(validatedData.voucherCode, manager),
          productIds,
          user.id, // Pass userId for instance-level validation
        );

        voucherDiscount = await this.calculateVoucherDiscount(
          cart.totalPrice,
          voucher,
        );
      }

      // 📦 **PHASE 4: CREATE ORDER** - Tạo đơn hàng
      const orderNumber = await this.generateOrderNumber();
      const finalTotal = Math.max(0, cart.totalPrice - voucherDiscount);

      const newOrder = manager.create(OrdersEntity, {
        creatorId: user.id,
        orderNumber,
        user,
        status: EStatusOrder.PENDING,
        total: finalTotal,
        shippingAddress: validatedData.shippingAddress,
      });
      const savedOrder = await manager.save(OrdersEntity, newOrder);
      this.logger.log(`Created order ${orderNumber} for user ${user.id}`);

      // 📋 **PHASE 5: CREATE ORDER ITEMS** - Tạo order items
      const orderItems: OrderItemsEntity[] = [];

      for (const cartItem of cart.items) {
        const orderItem = manager.create(OrderItemsEntity, {
          order: savedOrder,
          product: cartItem.product,
          quantity: cartItem.quantity,
          price: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity,
          voucherCode: validatedData.voucherCode || '',
          shippingAddress: validatedData.shippingAddress,
        });

        orderItems.push(orderItem);
      }

      await manager.save(OrderItemsEntity, orderItems);
      savedOrder.items = orderItems;

      // 📦 **PHASE 6: UPDATE INVENTORY** - Cập nhật tồn kho
      await this.updateProductInventory(cart.items, manager);

      // 🎫 **PHASE 7: UPDATE VOUCHER USAGE** - Cập nhật voucher usage
      if (voucher) {
        await this.updateVoucherUsage(voucher.id, manager);
      }

      // 🧹 **PHASE 8: CLEAR CART** - Xóa giỏ hàng
      await this.cartService.clearCart(user);

      this.logger.log(
        `Order ${orderNumber} created successfully with ${orderItems.length} items`,
      );

      // 📤 **PHASE 9: RETURN CLEAN RESPONSE** - Trả về response rút gọn
      return await this.getCleanOrderResponse(savedOrder.id, manager);
    });
  }

  /**
   * 📦 **Tạo đơn hàng trực tiếp (không từ cart)**
   *
   * **Logic:**
   * - Validate products tồn tại
   * - Check inventory availability
   * - Calculate totals
   * - Apply voucher discount
   * - Tạo order và items
   */
  async createOrder(
    user: User,
    createOrderDto: CreateOrderDto,
  ): Promise<OrdersEntity> {
    return await this.orderRepository.manager.transaction(async (manager) => {
      // ✅ **PHASE 1: VALIDATE PRODUCTS** - Kiểm tra sản phẩm
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products = await this.productRepository.find({
        where: productIds.map((id) => ({ id })),
        select: ['id', 'name', 'price', 'stock'],
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `Sản phẩm không tồn tại: ${missingIds.join(', ')}`,
        );
      }

      // 📊 **PHASE 2: VALIDATE INVENTORY & CALCULATE** - Kiểm tra kho & tính toán
      let subtotal = 0;
      const validatedItems = [];

      for (const itemDto of createOrderDto.items) {
        const product = products.find((p) => p.id === itemDto.productId);

        if (!product) {
          throw new BadRequestException(
            `Sản phẩm ID ${itemDto.productId} không tồn tại`,
          );
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho`,
          );
        }

        // Verify price consistency
        if (Math.abs(product.price - itemDto.price) > 0.01) {
          throw new BadRequestException(
            `Giá sản phẩm ${product.name} đã thay đổi. Giá hiện tại: ${product.price}`,
          );
        }

        const itemTotal = itemDto.price * itemDto.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          product,
          quantity: itemDto.quantity,
          price: itemDto.price,
          totalPrice: itemTotal,
        });
      }

      // 🎫 **PHASE 3: APPLY VOUCHER** - Áp dụng voucher
      let voucher: VoucherEntity | null = null;
      let voucherDiscount = 0;

      if (createOrderDto.voucherCode) {
        // Extract product IDs for voucher validation
        const productIds = createOrderDto.items.map((item) => item.productId);

        // Use VoucherService for complete validation including product applicability
        voucher = await this.voucherService.checkVoucher(
          await this.getVoucherIdByCode(createOrderDto.voucherCode, manager),
          productIds,
          user.id, // Pass userId for instance-level validation
        );

        voucherDiscount = await this.calculateVoucherDiscount(
          subtotal,
          voucher,
        );
      }

      // 📦 **PHASE 4: CREATE ORDER** - Tạo đơn hàng
      const orderNumber = await this.generateOrderNumber();
      const finalTotal = Math.max(0, subtotal - voucherDiscount);

      const order = manager.create(OrdersEntity, {
        orderNumber,
        user,
        status: EStatusOrder.PENDING,
        total: finalTotal,
      });

      const savedOrder = await manager.save(OrdersEntity, order);

      // 📋 **PHASE 5: CREATE ORDER ITEMS** - Tạo order items
      const orderItems: OrderItemsEntity[] = [];

      for (const validatedItem of validatedItems) {
        const orderItem = manager.create(OrderItemsEntity, {
          order: savedOrder,
          product: validatedItem.product,
          quantity: validatedItem.quantity,
          price: validatedItem.price,
          totalPrice: validatedItem.totalPrice,
          voucherCode: createOrderDto.voucherCode || '',
        });

        orderItems.push(orderItem);
      }

      await manager.save(OrderItemsEntity, orderItems);
      savedOrder.items = orderItems;

      // 📦 **PHASE 6: UPDATE INVENTORY** - Cập nhật tồn kho
      for (const validatedItem of validatedItems) {
        await manager.decrement(
          ProductsEntity,
          { id: validatedItem.product.id },
          'stock',
          validatedItem.quantity,
        );
      }

      // 🎫 **PHASE 7: UPDATE VOUCHER USAGE** - Cập nhật voucher
      if (voucher) {
        await this.updateVoucherUsage(voucher.id, manager);
      }

      this.logger.log(`Direct order ${orderNumber} created successfully`);

      // 📤 **Return clean response** - Trả về response rút gọn
      return await this.getCleanOrderResponse(savedOrder.id, manager);
    });
  }

  /**
   * 🔍 **Lấy đơn hàng theo ID**
   *
   * **Logic:**
   * - Tìm order với relations
   * - Check quyền truy cập (chỉ owner hoặc admin)
   * - Return order details
   */
  async getOrderById(orderId: number, user: User): Promise<OrdersEntity> {
    // First check if order exists and user has access
    const orderCheck = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
      select: ['id', 'user'],
    });

    if (!orderCheck) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
    }

    // Check ownership (user chỉ được xem order của mình)
    if (orderCheck.user.id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    // Return clean response
    return await this.getCleanOrderResponse(orderId);
  }

  /**
   * 📋 **Lấy danh sách đơn hàng của user**
   *
   * **Logic:**
   * - Filter theo user ID
   * - Apply các filters khác (status, date range)
   * - Pagination
   * - Return paginated results
   */
  async getUserOrders(
    user: User,
    queryDto: GetOrdersQueryDto,
  ): Promise<{ orders: OrdersEntity[]; total: number; pages: number }> {
    const { page = 1, limit = 10, status, fromDate, toDate } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categoryIds', 'categories')
      .select([
        // Order basic info
        'order.id',
        'order.orderNumber',
        'order.status',
        'order.reason',
        'order.total',
        'order.createdAt',

        // Items summary
        'items.id',
        'items.quantity',
        'items.price',
        'items.totalPrice',

        // Product essentials
        'product.id',
        'product.name',
        'product.image',
        'product.price',

        // Brand & Category names only
        'brand.name',
        'categories.name',
      ])
      .where('order.user.id = :userId', { userId: user.id });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (fromDate) {
      queryBuilder.andWhere('order.createdAt >= :fromDate', {
        fromDate: new Date(fromDate),
      });
    }

    if (toDate) {
      queryBuilder.andWhere('order.createdAt <= :toDate', {
        toDate: new Date(toDate + ' 23:59:59'),
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const orders = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const pages = Math.ceil(total / limit);

    return { orders, total, pages };
  }

  /**
   * ✏️ **Cập nhật trạng thái đơn hàng**
   *
   * **Logic:**
   * - Validate order tồn tại
   * - Check workflow transition hợp lệ
   * - Update status với reason
   * - Log status change
   */
  async updateOrderStatus(
    orderId: number,
    updateDto: UpdateOrderStatusDto,
    user: User,
  ): Promise<OrdersEntity> {
    return await this.orderRepository.manager.transaction(async (manager) => {
      const order = await manager.findOne(OrdersEntity, {
        where: { id: orderId },
        relations: ['user', 'items', 'items.product'],
      });

      if (!order) {
        throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
      }

      // Check ownership
      if (order.user.id !== user.id) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật đơn hàng này',
        );
      }

      // Validate status transition
      this.validateStatusTransition(order.status, updateDto.status);

      const oldStatus = order.status;
      order.status = updateDto.status;

      // 📝 **Save reason for status change** - Lưu lý do thay đổi trạng thái
      if (updateDto.reason) {
        order.reason = updateDto.reason;
      }

      // Handle special status changes
      if (updateDto.status === EStatusOrder.CANCELLED) {
        // Restore inventory khi hủy đơn
        await this.restoreInventory(order.items, manager);
      }

      const updatedOrder = await manager.save(OrdersEntity, order);

      this.logger.log(
        `Order ${order.orderNumber} status changed from ${oldStatus} to ${updateDto.status}` +
          (updateDto.reason ? ` - Reason: ${updateDto.reason}` : ''),
      );

      return updatedOrder;
    });
  }

  /**
   * ❌ **Hủy đơn hàng**
   *
   * **Logic:**
   * - Check order có thể hủy không
   * - Restore inventory
   * - Update status thành CANCELLED
   */
  async cancelOrder(
    orderId: number,
    user: User,
    reason?: string,
  ): Promise<OrdersEntity> {
    return await this.updateOrderStatus(
      orderId,
      {
        status: EStatusOrder.CANCELLED,
        reason: reason || 'Hủy đơn hàng theo yêu cầu khách hàng',
      },
      user,
    );
  }

  /**
   * 📊 **Thống kê đơn hàng**
   *
   * **Logic:**
   * - Group orders by time period
   * - Calculate metrics (count, revenue, avg)
   * - Return aggregated data
   */
  async getOrderStatistics(queryDto: OrderStatsQueryDto) {
    const { fromDate, toDate, groupBy = 'day' } = queryDto;

    let dateCondition = {};
    if (fromDate || toDate) {
      dateCondition = {
        createdAt: Between(
          new Date(fromDate || '1900-01-01'),
          new Date((toDate || '2100-12-31') + ' 23:59:59'),
        ),
      };
    }

    const orders = await this.orderRepository.find({
      where: dateCondition,
      relations: ['items'],
    });

    // Group by time period
    const grouped = this.groupOrdersByPeriod(orders, groupBy);

    return grouped;
  }

  // === HELPER METHODS === //

  /**
   * ✅ **Validate inventory availability**
   *
   * **Logic:** Kiểm tra tồn kho cho tất cả items trong cart
   */
  private async validateInventoryAvailability(
    cartItems: CartItemEntity[],
    manager: EntityManager,
  ): Promise<void> {
    for (const cartItem of cartItems) {
      const product = await this.productRepository.findOne({
        where: { id: cartItem.product.id },
        select: ['id', 'name', 'stock'],
      });

      if (!product) {
        throw new BadRequestException(
          `Sản phẩm ID ${cartItem.product.id} không tồn tại`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho, không đủ cho ${cartItem.quantity} yêu cầu`,
        );
      }
    }
  }

  /**
   * 🔍 **Lấy voucher ID theo code**
   *
   * **Logic:** Helper method để lấy voucher ID từ code để sử dụng với VoucherService
   * **Performance:** Chỉ select ID field để tối ưu query
   */
  private async getVoucherIdByCode(
    voucherCode: string,
    manager: EntityManager,
  ): Promise<number> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: voucherCode },
      select: ['id'],
    });

    if (!voucher) {
      throw new BadRequestException(`Voucher ${voucherCode} không tồn tại`);
    }

    return voucher.id;
  }

  /**
   * 🎫 **Cập nhật voucher usage count**
   *
   * **Logic:** Helper method để tăng used_count của voucher sau khi sử dụng
   */
  private async updateVoucherUsage(
    voucherId: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.increment(VoucherEntity, { id: voucherId }, 'used_count', 1);
  }

  /**
   * 💰 **Calculate voucher discount**
   */
  private async calculateVoucherDiscount(
    orderTotal: number,
    voucher: VoucherEntity,
  ): Promise<number> {
    let discount = 0;

    if (voucher.discount_type === ETypeDiscount.PERCENTAGE) {
      discount = (orderTotal * voucher.value_discount) / 100;

      if (voucher.max_discount_value && discount > voucher.max_discount_value) {
        discount = voucher.max_discount_value;
      }
    } else if (voucher.discount_type === ETypeDiscount.AMOUNT) {
      discount = voucher.value_discount;
    }

    return Math.min(discount, orderTotal); // Không giảm quá tổng tiền
  }

  /**
   * 📦 **Update product inventory**
   *
   * **Logic:** Giảm stock của sản phẩm sau khi tạo order thành công
   */
  private async updateProductInventory(
    cartItems: CartItemEntity[],
    manager: EntityManager,
  ): Promise<void> {
    for (const cartItem of cartItems) {
      await manager.decrement(
        ProductsEntity,
        { id: cartItem.product.id },
        'stock',
        cartItem.quantity,
      );
    }
  }

  /**
   * 🔄 **Restore inventory when cancelling order**
   *
   * **Logic:** Hoàn trả stock khi hủy đơn hàng
   */
  private async restoreInventory(
    orderItems: OrderItemsEntity[],
    manager: EntityManager,
  ): Promise<void> {
    for (const orderItem of orderItems) {
      await manager.increment(
        ProductsEntity,
        { id: orderItem.product.id },
        'stock',
        orderItem.quantity,
      );
    }
  }

  /**
   * 🔢 **Generate unique order number**
   */
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  /**
   * ✅ **Validate status transition**
   */
  private validateStatusTransition(
    currentStatus: EStatusOrder,
    newStatus: EStatusOrder,
  ): void {
    const validTransitions: Record<EStatusOrder, EStatusOrder[]> = {
      [EStatusOrder.PENDING]: [EStatusOrder.PROCESSING, EStatusOrder.CANCELLED],
      [EStatusOrder.PROCESSING]: [EStatusOrder.SHIPPED, EStatusOrder.CANCELLED],
      [EStatusOrder.SHIPPED]: [EStatusOrder.DELIVERED, EStatusOrder.RETURNED],
      [EStatusOrder.DELIVERED]: [EStatusOrder.RETURNED],
      [EStatusOrder.CANCELLED]: [], // Không thể chuyển từ CANCELLED
      [EStatusOrder.RETURNED]: [EStatusOrder.REFUNDED],
      [EStatusOrder.REFUNDED]: [], // Trạng thái cuối
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
      );
    }
  }

  /**
   * � **Get clean order response**
   *
   * **Logic:**
   * - Chỉ select fields cần thiết
   * - Loại bỏ circular references
   * - Optimize response size
   */
  private async getCleanOrderResponse(
    orderId: number,
    manager?: EntityManager,
  ): Promise<OrdersEntity> {
    const entityManager = manager || this.orderRepository.manager;

    const order = await entityManager
      .createQueryBuilder(OrdersEntity, 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categoryIds', 'categories')
      .select([
        // Order fields
        'order.id',
        'order.orderNumber',
        'order.status',
        'order.reason',
        'order.total',
        'order.shippingAddress',
        'order.createdAt',
        'order.updatedAt',

        // User fields (minimal)
        'user.id',
        'user.username',
        'user.email',
        'profile.fullName',
        'profile.phone',

        // Order items fields
        'items.id',
        'items.quantity',
        'items.price',
        'items.totalPrice',
        'items.voucherCode',

        // Product fields (essential only)
        'product.id',
        'product.name',
        'product.price',
        'product.image',
        'product.stock',

        // Brand & Category names only
        'brand.id',
        'brand.name',
        'categories.id',
        'categories.name',
      ])
      .where('order.id = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * �📊 **Group orders by time period**
   */
  private groupOrdersByPeriod(orders: OrdersEntity[], groupBy: string) {
    const grouped = new Map();

    orders.forEach((order) => {
      let key: string;
      const date = new Date(order.createdAt);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().substring(0, 7); // YYYY-MM
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          orders: [],
        });
      }

      const group = grouped.get(key);
      group.totalOrders += 1;
      group.totalRevenue += order.total;
      group.orders.push(order);
    });

    // Calculate averages
    Array.from(grouped.values()).forEach((group) => {
      if (group.totalOrders > 0) {
        group.averageOrderValue = group.totalRevenue / group.totalOrders;
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.period.localeCompare(a.period),
    );
  }
}
