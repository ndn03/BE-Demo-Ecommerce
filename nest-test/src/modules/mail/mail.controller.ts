import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { ApiTags } from '@nestjs/swagger/dist/decorators/api-use-tags.decorator';
import { Auth } from '../auth/auth.decorator';
import { ERole } from '@src/configs/role.config';
import { ApiOperation } from '@nestjs/swagger';

@ApiTags('Mailer')
@Controller('v1/mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Post('send-mailer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send mailer (for testing)' })
  async sendMailer() {
    const res = await this.mailService.sendMailer({
      to: '<recipient@example.com>',
      subject: 'Test Email from NestJS',
      template: 'forget-password', // Sử dụng template 'forget-password' đã tạo trong thư mục 'templates'
      context: {
        email: 'account@gmail.com',

        password: 'body.password',
        username: 'NguyenVanA',
      },
    });
    return { message: 'Send mail success.', data: res };
  }
}
