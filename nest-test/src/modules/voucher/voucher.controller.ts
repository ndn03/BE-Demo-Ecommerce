import { Controller } from '@nestjs/common';
import { VoucherService } from './voucher.service';


@Controller('rest/voucher')
export class VoucherController {

  constructor(private service: VoucherService) { }

}
