import { EOrderBy, EOrderByWithAt } from 'src/common/type.common';
export const ECategory = {
  ...EOrderBy,
  ...EOrderByWithAt,
  name: 'name',
  description: 'description',
  isActive: 'isActive',
};
export type ECategory = (typeof ECategory)[keyof typeof ECategory];
