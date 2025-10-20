import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ERevenueStatisticType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity('revenue_statistics')
@Index(['statisticType', 'periodStart', 'periodEnd'], { unique: true })
export class RevenueStatisticsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // 📊 Loại thống kê (ngày/tuần/tháng/năm)
  @Column({
    type: 'enum',
    enum: ERevenueStatisticType,
    default: ERevenueStatisticType.DAILY,
  })
  statisticType: ERevenueStatisticType;

  // 📅 Khoảng thời gian thống kê
  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  // 💰 Tổng doanh thu
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Tổng doanh thu trong kỳ',
  })
  totalRevenue: number;

  // 📦 Tổng số đơn hàng
  @Column({
    type: 'int',
    default: 0,
    comment: 'Tổng số đơn hàng hoàn thành',
  })
  totalOrders: number;

  // 🛒 Tổng số sản phẩm bán ra
  @Column({
    type: 'int',
    default: 0,
    comment: 'Tổng số lượng sản phẩm đã bán',
  })
  totalProductsSold: number;

  // 💵 Giá trị đơn hàng trung bình
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Giá trị trung bình mỗi đơn hàng',
  })
  averageOrderValue: number;

  // 🎫 Tổng giá trị voucher sử dụng
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Tổng giá trị voucher đã sử dụng',
  })
  totalVoucherUsed: number;

  // 👥 Số khách hàng unique
  @Column({
    type: 'int',
    default: 0,
    comment: 'Số lượng khách hàng duy nhất có giao dịch',
  })
  uniqueCustomers: number;

  // 👥 Khách hàng mới
  @Column({
    type: 'int',
    default: 0,
    comment: 'Số lượng khách hàng mới đăng ký',
  })
  newCustomers: number;

  // 🔄 Khách hàng quay lại
  @Column({
    type: 'int',
    default: 0,
    comment: 'Số lượng khách hàng quay lại mua hàng',
  })
  returningCustomers: number;

  // 📈 Tỉ lệ chuyển đổi (conversion rate)
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Tỉ lệ chuyển đổi từ cart thành order (%)',
  })
  conversionRate: number;

  // 🏆 Sản phẩm bán chạy nhất (lưu JSON)
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Top sản phẩm bán chạy nhất [{productId, quantity, revenue}]',
  })
  topProducts:
    | {
        productId: number;
        productName: string;
        quantity: number;
        revenue: number;
      }[]
    | null;

  // 🎯 Danh mục bán chạy nhất (lưu JSON)
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Top danh mục bán chạy nhất [{categoryId, quantity, revenue}]',
  })
  topCategories:
    | {
        categoryId: number;
        categoryName: string;
        quantity: number;
        revenue: number;
      }[]
    | null;

  // ⏰ Timestamps
  @CreateDateColumn({
    comment: 'Thời điểm tạo bản ghi thống kê',
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Thời điểm cập nhật cuối cùng',
  })
  updatedAt: Date;

  // 📝 Ghi chú bổ sung
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Ghi chú hoặc thông tin bổ sung',
  })
  notes: string | null;

  // 🔄 Trạng thái tính toán
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Đánh dấu đã hoàn thành tính toán',
  })
  isCalculated: boolean;

  // 📊 Metadata bổ sung (JSON)
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadata bổ sung cho thống kê',
  })
  metadata: {
    calculationDuration?: number; // Thời gian tính toán (ms)
    dataSource?: string; // Nguồn data
    version?: string; // Version của algorithm
    [key: string]: any;
  } | null;
}
