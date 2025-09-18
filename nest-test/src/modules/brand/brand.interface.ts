import { EOrderBy, EOrderByWithAt } from 'src/common/type.common';
export const EBrand = {
  ...EOrderBy,
  ...EOrderByWithAt,
  name: 'name',
  description: 'description',
  isActive: 'isActive',
};
export type EBrand = (typeof EBrand)[keyof typeof EBrand];
