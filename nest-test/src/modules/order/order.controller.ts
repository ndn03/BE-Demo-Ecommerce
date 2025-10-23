import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/modules/auth/jwt-auth.guard';
import { Auth, AuthUser } from '@src/modules/auth/auth.decorator';
import { User } from '@src/entities/user.entity';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  UpdateOrderStatusDto,
  CreateOrderFromCartDto,
} from './dto/update-order.dto';
import { GetOrdersQueryDto, OrderStatsQueryDto } from './dto/query-order.dto';
import { OrdersEntity } from '@src/entities/order.entity';

@ApiTags('📦 Order Management')
@Controller('v1/orders')
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 🛒 **Tạo đơn hàng từ giỏ hàng**
   *
   * **Endpoint:** POST /v1/orders/from-cart
   * **Logic:** Convert cart thành order với voucher validation
   */
  @Post('from-cart')
  @Auth()
  @ApiOperation({
    summary: 'Create order from cart',
    description:
      'Convert user cart to order with inventory validation and voucher application',
  })
  @Auth()
  @ApiResponse({ status: 404, description: 'Cart or voucher not found' })
  @HttpCode(HttpStatus.CREATED)
  async createOrderFromCart(
    @AuthUser() user: User,
    @Body() createOrderDto: CreateOrderFromCartDto,
  ): Promise<{ message: string; order: OrdersEntity }> {
    const order = await this.orderService.createOrderFromCart(
      user,
      createOrderDto,
    );
    const shippingAddress = createOrderDto.shippingAddress;
    console.log('Shipping Address:', shippingAddress);
    return {
      message: 'Đặt hàng thành công từ giỏ hàng',
      order,
    };
  }

  /**
   * 📦 **Tạo đơn hàng trực tiếp**
   *
   * **Endpoint:** POST /v1/orders
   * **Logic:** Tạo order trực tiếp với product list
   */
  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Create order directly',
    description:
      'Create order directly with product list, inventory and pricing validation',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrdersEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid products or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Product or voucher not found' })
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @AuthUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<{ message: string; order: OrdersEntity }> {
    const order = await this.orderService.createOrder(user, createOrderDto);

    return {
      message: 'Đặt hàng thành công',
      order,
    };
  }

  /**
   * 📋 **Lấy danh sách đơn hàng của user**
   *
   * **Endpoint:** GET /v1/orders
   * **Logic:** Paginated list với filters
   */
  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Get paginated list of user orders with filtering options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by order status',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'From date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'To date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrdersEntity' },
            },
            total: { type: 'number' },
            pages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  async getMyOrders(
    @AuthUser() user: User,
    @Query() queryDto: GetOrdersQueryDto,
  ): Promise<{
    message: string;
    data: {
      orders: OrdersEntity[];
      total: number;
      pages: number;
      currentPage: number;
    };
  }> {
    const { orders, total, pages } = await this.orderService.getUserOrders(
      user,
      queryDto,
    );

    return {
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders,
        total,
        pages,
        currentPage: queryDto.page || 1,
      },
    };
  }

  /**
   * � **Admin - Lấy tất cả đơn hàng**
   *
   * **Endpoint:** GET /v1/orders/admin/all
   * **Logic:** Admin view all orders với pagination
   */
  @Get('admin/all')
  @ApiOperation({
    summary: 'Admin get all orders',
    description: 'Get paginated list of all orders for admin management',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by order status',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrdersEntity' },
            },
            total: { type: 'number' },
            pages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  async getAllOrders(
    @Query() queryDto: GetOrdersQueryDto,
  ): Promise<{
    message: string;
    data: {
      orders: OrdersEntity[];
      total: number;
      pages: number;
      currentPage: number;
    };
  }> {
    const { orders, total, pages } = await this.orderService.getAllOrders(
      queryDto,
    );

    return {
      message: 'Lấy danh sách tất cả đơn hàng thành công',
      data: {
        orders,
        total,
        pages,
        currentPage: queryDto.page || 1,
      },
    };
  }

  /**
   * �🔍 **Lấy chi tiết đơn hàng**
   *
   * **Endpoint:** GET /v1/orders/:id
   * **Logic:** Get order details với ownership validation
   */
  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get order by ID',
    description:
      'Get detailed information of specific order with ownership validation',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrdersEntity,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not order owner' })
  async getOrderById(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) orderId: number,
  ): Promise<{ message: string; order: OrdersEntity }> {
    const order = await this.orderService.getOrderById(orderId, user);

    return {
      message: 'Lấy chi tiết đơn hàng thành công',
      order,
    };
  }

  /**
   * ✏️ **Cập nhật trạng thái đơn hàng**
   *
   * **Endpoint:** PUT /v1/orders/:id/status
   * **Logic:** Update status với workflow validation
   */
  @Put(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Update order status with workflow validation and business rules',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrdersEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid status transition',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not order owner' })
  async updateOrderStatus(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateDto: UpdateOrderStatusDto,
  ): Promise<{ message: string; order: OrdersEntity }> {
    const order = await this.orderService.updateOrderStatus(
      orderId,
      updateDto,
      user,
    );

    return {
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order,
    };
  }

  /**
   * ❌ **Hủy đơn hàng**
   *
   * **Endpoint:** DELETE /v1/orders/:id/cancel
   * **Logic:** Cancel order với inventory restoration
   */
  @Delete(':id/cancel')
  @Auth()
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel order and restore inventory if applicable',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrdersEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - order cannot be cancelled',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not order owner' })
  async cancelOrder(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) orderId: number,
    @Body('reason') reason?: string,
  ): Promise<{ message: string; order: OrdersEntity }> {
    const order = await this.orderService.cancelOrder(orderId, user, reason);

    return {
      message: 'Hủy đơn hàng thành công',
      order,
    };
  }

  /**
   * 📊 **Thống kê đơn hàng**
   *
   * **Endpoint:** GET /v1/orders/stats
   * **Logic:** Order statistics với time grouping
   */
  @Get('stats/overview')
  @Auth()
  @ApiOperation({
    summary: 'Get order statistics',
    description:
      'Get order statistics grouped by time periods with revenue metrics',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'From date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'To date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    description: 'Group by period: day, week, month, year',
    enum: ['day', 'week', 'month', 'year'],
  })
  async getOrderStatistics(
    @Query() queryDto: OrderStatsQueryDto,
  ): Promise<{ message: string; data: any[] }> {
    const stats = await this.orderService.getOrderStatistics(queryDto);

    return {
      message: 'Lấy thống kê đơn hàng thành công',
      data: stats,
    };
  }

  /**
   * 🔄 **Reorder - Đặt lại đơn hàng**
   *
   * **Endpoint:** POST /v1/orders/:id/reorder
   * **Logic:** Tạo order mới dựa trên order cũ
   */
  @Post(':id/reorder')
  @Auth()
  @ApiOperation({
    summary: 'Reorder from existing order',
    description:
      'Create new order based on existing order with current prices and inventory check',
  })
  @ApiParam({ name: 'id', description: 'Original Order ID', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Reorder created successfully',
    type: OrdersEntity,
  })
  @HttpCode(HttpStatus.CREATED)
  async reorder(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) originalOrderId: number,
  ): Promise<{ message: string; order: OrdersEntity; warnings?: string[] }> {
    // Get original order
    const originalOrder = await this.orderService.getOrderById(
      originalOrderId,
      user,
    );

    // Convert to CreateOrderDto
    const createOrderDto: CreateOrderDto = {
      items: originalOrder.items.map((orderItem) => ({
        productId: orderItem.product.id,
        quantity: orderItem.quantity,
        price: orderItem.price, // Will be validated against current price
      })),
      voucherCode: originalOrder.items[0]?.voucherCode || undefined,
      shippingAddress: originalOrder.shippingAddress,
    };

    try {
      const newOrder = await this.orderService.createOrder(
        user,
        createOrderDto,
      );

      return {
        message: 'Đặt lại đơn hàng thành công',
        order: newOrder,
      };
    } catch (error) {
      // Handle price/availability issues gracefully
      if (
        error.message.includes('đã thay đổi') ||
        error.message.includes('trong kho')
      ) {
        return {
          message: 'Có thay đổi về giá hoặc tồn kho, vui lòng kiểm tra lại',
          order: null,
          warnings: [error.message],
        };
      }
      throw error;
    }
  }
}
