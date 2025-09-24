// voucher.constants.ts
import { ETypeDiscount } from '@src/common/type.common';

export const ALLOWED_VOUCHER_DISCOUNTS: ETypeDiscount[] = [
  ETypeDiscount.PERCENTAGE,
  ETypeDiscount.AMOUNT,
];
