import { ISendMailOptions } from '@nestjs-modules/mailer';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionOptions, Job, Worker } from 'bullmq';
import { EMAIL_QUEUE_NAME } from './mail.interface';
import { MailService } from './mail.service';
import { safeParseInt } from 'src/common/utils/string.util';

@Injectable()
export class MailProcessor implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly connectionOptions: ConnectionOptions;
  private readonly numberOfWorkers: number;
  private readonly workerConcurrency: number;
  private readonly queueName: string;
  private readonly _workers: Worker[] = [];

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    // Lấy cấu hình Redis từ ConfigService
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = safeParseInt(
      this.configService.get<string>('REDIS_PORT'),
      6379,
    );

    if (!redisHost) {
      throw new Error('REDIS_HOST is not configured');
    }

    this.connectionOptions = {
      host: redisHost,
      port: redisPort,
    };

    // Lấy cấu hình từ ConfigService hoặc sử dụng mặc định
    this.queueName = EMAIL_QUEUE_NAME;
    this.numberOfWorkers = safeParseInt(
      this.configService.get<string>('MAIL_WORKER_COUNT'),
      5,
    );
    this.workerConcurrency = safeParseInt(
      this.configService.get<string>('MAIL_WORKER_CONCURRENCY'),
      3,
    );
  }

  async onModuleInit() {
    // Tạo các worker
    for (let i = 0; i < this.numberOfWorkers; i++) {
      const worker = new Worker(
        this.queueName,
        async (job: Job<ISendMailOptions>) => this.processSendMailJob(job),
        {
          connection: this.connectionOptions,
          concurrency: this.workerConcurrency,
        },
      );

      // Sự kiện worker
      worker.on('completed', (job) => {
        this.logger.log(`Job ${job.id} has been completed`);
      });

      worker.on('failed', (job, err) => {
        this.logger.error(
          `Job ${job.id} has failed with error: ${err.message}`,
          err.stack,
        );
      });

      worker.on('error', (err) => {
        this.logger.error(
          `Worker encountered an error: ${err.message}`,
          err.stack,
        );
      });

      this._workers.push(worker);
      this.logger.log(
        `Worker ${i + 1}/${this.numberOfWorkers} started for queue ${this.queueName}`,
      );
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `Shutting down MailProcessor due to signal: ${signal || 'unknown'}`,
    );
    await Promise.all(this._workers.map((worker) => worker.close()));
  }

  get workers(): Worker[] {
    return this._workers;
  }

  async processSendMailJob(job: Job<ISendMailOptions>): Promise<void> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      const body = job.data;
      // Kiểm tra các trường bắt buộc
      if (!body.to) {
        throw new Error('Recipient email address (to) is missing');
      }
      if (!body.subject) {
        throw new Error('Email subject is missing');
      }
      const result = await this.mailService.sendMailer(body);
      this.logger.log(
        `Job ${job.id} completed successfully: ${JSON.stringify(result, null, 2)}`,
      );
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Rethrow để BullMQ xử lý retry
    }
  }
}
