import { EOrderBy, EOrderByWithAt } from 'src/common/type.common';
export const EVoucher = {
  ...EOrderBy,
  ...EOrderByWithAt,
  code: 'code',
  price: 'price',
  discount: 'discount',
  status: 'status',
  isActive: 'isActive',
};
export type EVoucher = (typeof EVoucher)[keyof typeof EVoucher];
