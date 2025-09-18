import { EOrderBy, EOrderByWithAt } from 'src/common/type.common';
export const EProduct = {
  ...EOrderBy,
  ...EOrderByWithAt,
  name: 'name',
  description: 'description',
  price: 'price',
  discount: 'discount',
  price_discount: 'price_discount',
  stock: 'stock',
  status: 'status',
  isActive: 'isActive',
};
export type EProduct = (typeof EProduct)[keyof typeof EProduct];
