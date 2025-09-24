import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system/check-time')
  async checkTimeSetting() {
    try {
      const userTimeZone = dayjs.tz.guess();
      const localTime = dayjs().tz(userTimeZone).format();
      const utcTime = dayjs().utc().format();

      return {
        userTimeZone,
        localTime,
        utcTime,
        time: new Date(),
        node: process.env.NODE_ENV,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
