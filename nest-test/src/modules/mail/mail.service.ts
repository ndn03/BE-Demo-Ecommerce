import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EMAIL_QUEUE_NAME, SEND_MAIL_JOB_NAME } from './mail.interface';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
  ) {}

  async sendMailer(body: ISendMailOptions): Promise<any> {
    try {
      // ép kiểu trả về để ESLint không báo unsafe
      const res = await this.mailerService.sendMail(body);

      this.logger.log('🚀 ~ MailService ~ sendMail result:', res);

      return res;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Send mail failed: ${error.message}`);
      } else {
        this.logger.error('Send mail failed with unknown error', error);
      }
      throw error; // vẫn ném lại để controller bắt
    }
  }

  async addSendMailToQueue(data: ISendMailOptions): Promise<void> {
    await this.emailQueue.add(SEND_MAIL_JOB_NAME, data);
    this.logger.log(`Added send mail job to queue successfully!`);
  }
}
