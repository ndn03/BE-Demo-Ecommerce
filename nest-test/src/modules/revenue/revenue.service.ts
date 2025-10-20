import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  RevenueStatisticsEntity,
  ERevenueStatisticType,
} from '@src/entities/revenue-statistics.entity';
import { OrdersEntity } from '@src/entities/order.entity';
import { CartEntity } from '@src/entities/cart.entity';

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(
    @InjectRepository(RevenueStatisticsEntity)
    private readonly revenueRepository: Repository<RevenueStatisticsEntity>,

    @InjectRepository(OrdersEntity)
    private readonly orderRepository: Repository<OrdersEntity>,

    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
  ) {}

  /**
   * 📊 **Lấy thống kê doanh thu theo khoảng thời gian**
   *
   * **Logic:**
   * - Query revenue statistics theo date range
   * - Group by period (daily/weekly/monthly/yearly)
   * - Return aggregated data
   */
  async getRevenueStatistics(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
  ) {
    const query = this.revenueRepository
      .createQueryBuilder('revenue')
      .where('revenue.periodStart >= :startDate', { startDate })
      .where('revenue.periodEnd <= :endDate', { endDate })
      .orderBy('revenue.periodStart', 'DESC');

    const statistics = await query.getMany();

    // 🧮 **Group theo period nếu cần**
    if (period !== 'daily') {
      return this.groupStatisticsByPeriod(statistics, period);
    }

    return statistics;
  }

  /**
   * 💰 **Tính toán doanh thu từ orders hoàn thành**
   *
   * **Logic:**
   * - Query orders với status DELIVERED trong ngày
   * - Tính tổng revenue, số lượng orders
   * - Tính average order value
   * - Update hoặc tạo mới revenue record
   */
  async calculateDailyRevenue(date: Date): Promise<RevenueStatisticsEntity> {
    return await this.revenueRepository.manager.transaction(async (manager) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // 📊 **PHASE 1: CALCULATE ORDER METRICS** - Tính toán từ orders
      const orderStats = await manager
        .createQueryBuilder(OrdersEntity, 'order')
        .select([
          'COUNT(order.id) as totalOrders',
          'SUM(order.totalPrice) as totalRevenue',
          'AVG(order.totalPrice) as averageOrderValue',
          'COUNT(DISTINCT order.userId) as uniqueCustomers',
        ])
        .where('order.createdAt >= :startOfDay', { startOfDay })
        .where('order.createdAt <= :endOfDay', { endOfDay })
        .where('order.status = :status', { status: 'DELIVERED' })
        .getRawOne();

      // 🛒 **PHASE 2: CALCULATE CART METRICS** - Tính toán từ carts
      const cartStats = await manager
        .createQueryBuilder(CartEntity, 'cart')
        .select([
          'COUNT(cart.id) as activeCarts',
          'SUM(cart.totalPrice) as pendingRevenue',
          'AVG(cart.totalPrice) as averageCartValue',
        ])
        .innerJoin('cart.items', 'items')
        .where('cart.updatedAt >= :startOfDay', { startOfDay })
        .where('cart.updatedAt <= :endOfDay', { endOfDay })
        .having('COUNT(items.id) > 0') // Chỉ cart có items
        .getRawOne();

      // 🔍 **PHASE 3: GET OR CREATE RECORD** - Lấy hoặc tạo record
      let revenueRecord = await manager.findOne(RevenueStatisticsEntity, {
        where: {
          periodStart: startOfDay,
          statisticType: ERevenueStatisticType.DAILY,
        },
      });

      if (!revenueRecord) {
        revenueRecord = manager.create(RevenueStatisticsEntity, {
          periodStart: startOfDay,
          periodEnd: endOfDay,
          statisticType: ERevenueStatisticType.DAILY,
        });
      }

      // 📊 **PHASE 4: UPDATE METRICS** - Cập nhật số liệu
      revenueRecord.totalRevenue = parseFloat(orderStats.totalRevenue) || 0;
      revenueRecord.totalOrders = parseInt(orderStats.totalOrders) || 0;
      revenueRecord.averageOrderValue =
        parseFloat(orderStats.averageOrderValue) || 0;
      revenueRecord.uniqueCustomers = parseInt(orderStats.uniqueCustomers) || 0;

      // 🧮 **Calculate conversion rate** - Simple calculation
      const totalActiveCarts = parseInt(cartStats.activeCarts) || 0;
      if (totalActiveCarts > 0) {
        revenueRecord.conversionRate =
          (revenueRecord.totalOrders / totalActiveCarts) * 100;
      } else {
        revenueRecord.conversionRate = 0;
      }

      // 💾 **PHASE 5: SAVE RECORD** - Lưu record
      const savedRecord = await manager.save(
        RevenueStatisticsEntity,
        revenueRecord,
      );

      this.logger.log(
        `Updated daily revenue for ${startOfDay.toISOString().split('T')[0]}: $${revenueRecord.totalRevenue}`,
      );
      return savedRecord;
    });
  }

  /**
   * 📈 **Tự động tính doanh thu hàng ngày lúc 1:00 AM**
   *
   * **Logic:**
   * - Chạy cron job mỗi ngày lúc 1:00 AM
   * - Tính doanh thu cho ngày hôm qua
   * - Update weekly/monthly aggregates
   */
  @Cron('0 1 * * *') // 1:00 AM mỗi ngày
  async autoCalculateDailyRevenue() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await this.calculateDailyRevenue(yesterday);
      await this.updateWeeklyStats(yesterday);
      await this.updateMonthlyStats(yesterday);

      this.logger.log('Auto-calculated daily revenue statistics completed');
    } catch (error) {
      this.logger.error('Failed to auto-calculate daily revenue', error);
    }
  }

  /**
   * 📊 **Tính weekly revenue aggregates**
   *
   * **Logic:**
   * - Tính tổng doanh thu theo tuần
   * - Update weekly metrics
   */
  private async updateWeeklyStats(date: Date): Promise<void> {
    // Get start of week (Monday)
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyStats = await this.revenueRepository
      .createQueryBuilder('revenue')
      .select([
        'SUM(revenue.totalRevenue) as weeklyRevenue',
        'SUM(revenue.totalOrders) as weeklyOrders',
        'AVG(revenue.averageOrderValue) as weeklyAvgOrder',
        'SUM(revenue.uniqueCustomers) as weeklyCustomers',
      ])
      .where('revenue.statisticDate >= :startOfWeek', { startOfWeek })
      .where('revenue.statisticDate <= :endOfWeek', { endOfWeek })
      .getRawOne();

    // Update weekly record
    let weeklyRecord = await this.revenueRepository.findOne({
      where: {
        periodStart: startOfWeek,
        statisticType: ERevenueStatisticType.WEEKLY,
      },
    });

    if (!weeklyRecord) {
      weeklyRecord = this.revenueRepository.create({
        periodStart: startOfWeek,
        periodEnd: endOfWeek,
        statisticType: ERevenueStatisticType.WEEKLY,
      });
    }

    weeklyRecord.totalRevenue = parseFloat(weeklyStats.weeklyRevenue) || 0;
    weeklyRecord.totalOrders = parseInt(weeklyStats.weeklyOrders) || 0;
    weeklyRecord.averageOrderValue =
      parseFloat(weeklyStats.weeklyAvgOrder) || 0;
    weeklyRecord.uniqueCustomers = parseInt(weeklyStats.weeklyCustomers) || 0;

    await this.revenueRepository.save(weeklyRecord);
  }

  /**
   * 📈 **Tính monthly revenue aggregates**
   *
   * **Logic:**
   * - Tính tổng doanh thu theo tháng
   * - Update monthly metrics
   */
  private async updateMonthlyStats(date: Date): Promise<void> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthlyStats = await this.revenueRepository
      .createQueryBuilder('revenue')
      .select([
        'SUM(revenue.totalRevenue) as monthlyRevenue',
        'SUM(revenue.totalOrders) as monthlyOrders',
        'AVG(revenue.averageOrderValue) as monthlyAvgOrder',
        'SUM(revenue.uniqueCustomers) as monthlyCustomers',
      ])
      .where('revenue.statisticDate >= :startOfMonth', { startOfMonth })
      .where('revenue.statisticDate <= :endOfMonth', { endOfMonth })
      .getRawOne();

    // Update monthly record
    let monthlyRecord = await this.revenueRepository.findOne({
      where: {
        periodStart: startOfMonth,
        statisticType: ERevenueStatisticType.MONTHLY,
      },
    });

    if (!monthlyRecord) {
      monthlyRecord = this.revenueRepository.create({
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        statisticType: ERevenueStatisticType.MONTHLY,
      });
    }

    monthlyRecord.totalRevenue = parseFloat(monthlyStats.monthlyRevenue) || 0;
    monthlyRecord.totalOrders = parseInt(monthlyStats.monthlyOrders) || 0;
    monthlyRecord.averageOrderValue =
      parseFloat(monthlyStats.monthlyAvgOrder) || 0;
    monthlyRecord.uniqueCustomers =
      parseInt(monthlyStats.monthlyCustomers) || 0;

    await this.revenueRepository.save(monthlyRecord);
  }

  /**
   * 🔄 **Group statistics by period**
   *
   * **Logic:**
   * - Group daily stats into weekly/monthly/yearly
   * - Aggregate metrics appropriately
   */
  private groupStatisticsByPeriod(
    statistics: RevenueStatisticsEntity[],
    period: 'weekly' | 'monthly' | 'yearly',
  ) {
    // Implementation for grouping logic
    const grouped = new Map();

    statistics.forEach((stat) => {
      let key: string;

      switch (period) {
        case 'weekly':
          // Get week start date
          const weekStart = new Date(stat.periodStart);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          key = weekStart.toISOString().split('T')[0];
          break;

        case 'monthly':
          key = stat.periodStart.toISOString().substring(0, 7); // YYYY-MM
          break;

        case 'yearly':
          key = stat.periodStart.getFullYear().toString();
          break;
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          totalRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          averageOrderValue: 0,
          records: [],
        });
      }

      const group = grouped.get(key);
      group.totalRevenue += stat.totalRevenue;
      group.totalOrders += stat.totalOrders;
      group.uniqueCustomers += stat.uniqueCustomers;
      group.records.push(stat);
    });

    // Calculate averages
    Array.from(grouped.values()).forEach((group) => {
      if (group.totalOrders > 0) {
        group.averageOrderValue = group.totalRevenue / group.totalOrders;
      }
    });

    return Array.from(grouped.values());
  }

  /**
   * 💹 **Lấy dashboard metrics**
   *
   * **Logic:**
   * - Current day revenue
   * - Week over week growth
   * - Month over month growth
   * - Top performing metrics
   */
  async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [todayStats, yesterdayStats, lastWeekStats, lastMonthStats] =
      await Promise.all([
        this.revenueRepository.findOne({
          where: {
            periodStart: today,
            statisticType: ERevenueStatisticType.DAILY,
          },
        }),
        this.revenueRepository.findOne({
          where: {
            periodStart: yesterday,
            statisticType: ERevenueStatisticType.DAILY,
          },
        }),
        this.revenueRepository.findOne({
          where: {
            periodStart: lastWeek,
            statisticType: ERevenueStatisticType.DAILY,
          },
        }),
        this.revenueRepository.findOne({
          where: {
            periodStart: lastMonth,
            statisticType: ERevenueStatisticType.DAILY,
          },
        }),
      ]);

    return {
      today: todayStats || { totalRevenue: 0, totalOrders: 0 },
      growthMetrics: {
        dailyGrowth: this.calculateGrowthRate(
          todayStats?.totalRevenue,
          yesterdayStats?.totalRevenue,
        ),
        weeklyGrowth: this.calculateGrowthRate(
          todayStats?.totalRevenue,
          lastWeekStats?.totalRevenue,
        ),
        monthlyGrowth: this.calculateGrowthRate(
          todayStats?.totalRevenue,
          lastMonthStats?.totalRevenue,
        ),
      },
    };
  }

  /**
   * 📊 **Calculate growth rate**
   */
  private calculateGrowthRate(current?: number, previous?: number): number {
    if (!current || !previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}
