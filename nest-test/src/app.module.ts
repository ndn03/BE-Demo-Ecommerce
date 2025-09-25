// import { ExceptionFilter } from '@filters/exception/exception.filter';
// import { ResponseInterceptor } from '@interceptors/response/response.interceptor';
import { RoleGuard } from './modules/auth/role.guard';
import { HttpModule } from '@nestjs/axios';
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core'; //, APP_INTERCEPTOR, APP_FILTER
import { ScheduleModule } from '@nestjs/schedule';
// import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AppController } from '@src/app.controller';
// import { AppService } from '@src/app.service';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSource, typeOrmConfig } from './configs/typeorm.config';
import configurationConfig from './configs/configuration.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ContextModule } from './common/context/context.module';
import { MediaModule } from './modules/upload/media.module';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CategoryModule } from '@src/modules/category/category.module';
import { BrandsModule } from 'src/modules/brand/brand.module';
import { ProductModule } from 'src/modules/product/product.module';
import { CartModule } from '@src/modules/cart/cart.module';
import { VoucherModule } from './modules/voucher/voucher.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      load: [configurationConfig],
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot({ cronJobs: true, intervals: true, timeouts: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        retryStrategy: (times) => {
          const logger = new Logger('Redis');
          logger.warn(`Redis connection attempt ${times}: Retrying in 5s...`);
          return 5000;
        },
        maxRetriesPerRequest: 3,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    // Add this line to register a queue for health check
    BullModule.registerQueue({
      name: 'health-check',
    }),
    HttpModule,
    AuthModule,
    UserModule,
    ContextModule,
    MediaModule,
    CategoryModule,
    BrandsModule,
    ProductModule,
    CartModule,
    VoucherModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // { provide: APP_FILTER, useClass: ExceptionFilter },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('AppModule');

  constructor(
    private readonly ds: DataSource,
    @InjectQueue('health-check')
    private healthCheckQueue: Queue<any, any, string>,
  ) {}

  async onModuleInit() {
    // Database initialization
    if (!dataSource.isInitialized) {
      dataSource.initialize().catch((err) => {
        console.error('Error during DataSource initialization', err);
      });
    }
    (globalThis as typeof globalThis & { dataSource: DataSource }).dataSource =
      this.ds;

    // Redis connection check - will show immediately on npm start:dev
    try {
      this.logger.log(
        `📡 Checking Redis connection to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}...`,
      );
      const client = await this.healthCheckQueue.client;
      const pong = await client.ping();
      this.logger.log(`Redis connection successful: ${pong}`);

      // Get more Redis details
      const info = await client.info();
      const version = info
        .split('\n')
        .find((line) => line.startsWith('redis_version:'));
      const memory = info
        .split('\n')
        .find((line) => line.startsWith('used_memory_human:'));
      let clients: string | undefined = undefined;
      if (typeof info === 'string') {
        clients = info
          .split('\n')
          .find((line: string) => line.startsWith('connected_clients:'));
      }

      this.logger.log(
        `Redis server: ${version?.split(':')[1].trim() || 'unknown'}`,
      );
      this.logger.log(
        ` Memory usage: ${memory?.split(':')[1].trim() || 'unknown'}`,
      );
      this.logger.log(
        ` Connected clients: ${clients?.split(':')[1].trim() || 'unknown'}`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Redis connection failed: ${err.message}`, err.stack);
      // Optional: If Redis is critical, you might want to exit the process
      // process.exit(1);
    }
  }
}
