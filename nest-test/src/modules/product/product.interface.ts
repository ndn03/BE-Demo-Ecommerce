import { EOrderBy, EOrderByWithAt } from 'src/common/type.common';
export const EProduct = {
  ...EOrderBy,
  ...EOrderByWithAt,
  name: 'name',
  price: 'price',
  discount: 'discount',
  final_price: 'final_price',
  stock: 'stock',
  status: 'status',
  isActive: 'isActive',
};
export type EProduct = (typeof EProduct)[keyof typeof EProduct];
