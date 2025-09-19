import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE_NAME } from './mail.interface';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3, // số lần thử lại nếu job thất bại
        backoff: { type: 'exponential', delay: 1000 }, // thời gian chờ giữa các lần thử lại
        removeOnComplete: {
          count: 100, // giữ lại 100 job đã hoàn thành gần nhất
          age: 60 * 60 * 24, // Xóa job đã hoàn thành cũ hơn 24 giờ
        },
        removeOnFail: {
          count: 100, // Giữ lại 100 job thất bại gần nhất
          age: 60 * 60 * 24, // Xóa job thất bại cũ hơn 24 giờ
        },
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', /// SMTP server của Gmail, sau này  nên dùng sendgrid hoặc mailgun
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAILER_EMAIL,
          pass: process.env.MAILER_PASSWORD,
        },
      },
      defaults: {
        from: `"BE-Ecommerce" <${process.env.MAILER_EMAIL}>`,
      },
      template: {
        dir: join(__dirname, '..', '..', '/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
