import { Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Hàm checkDuplicateByField
 * Dùng để kiểm tra xem trong bảng có bản ghi nào trùng giá trị ở 1 field (cột) hay không.
 *
 * @template T - Kiểu entity
 * @param repository Repository<T> - Repository của entity cần check
 * @param field keyof T - Tên cột cần check
 * @param value any - Giá trị cần kiểm tra
 * @param options
 *   - alias: string        => alias trong query (mặc định: "entity")
 *   - withDeleted: boolean => có bao gồm bản ghi đã soft-delete không (mặc định: false)
 *   - excludeId: number    => id cần loại trừ (thường dùng khi update để bỏ qua bản ghi hiện tại)
 *   - idColumn: keyof T    => tên cột id (mặc định: "id")
 *   - caseInsensitive: boolean => so sánh không phân biệt hoa thường (chỉ áp dụng cho string)
 *
 * @returns Promise<boolean> - Trả về true nếu có bản ghi trùng, ngược lại false
 * @example
 * const isDuplicate = await checkDuplicateByField(userRepository, 'email', 'test@example.com', {
 *   withDeleted: false,
 *   idColumn: 'id',
 *   caseInsensitive: true,
 * });
 * ===> true
 */
export async function checkDuplicateByField<T>(
  repository: Repository<T>,
  field: keyof T,
  value: any,
  options?: {
    alias?: string; // alias trong query (mặc định: "entity")
    withDeleted?: boolean; // có bao gồm bản ghi đã soft-delete không (mặc định: false)
    excludeId?: number; // id cần loại trừ (thường dùng khi update để bỏ qua bản ghi hiện tại)
    idColumn?: keyof T; // tên cột id (mặc định: "id")
    caseInsensitive?: boolean; // so sánh không phân biệt hoa thường (chỉ áp dụng cho string)
  },
): Promise<boolean> {
  if (value === undefined || value === null) return false;

  const alias = options?.alias ?? 'entity';
  const idColumn = (options?.idColumn ?? 'id') as string;

  // Tạo query builder
  const query: SelectQueryBuilder<T> = repository.createQueryBuilder(alias);

  // Có bao gồm bản ghi đã bị soft delete không
  if (options?.withDeleted) {
    query.withDeleted();
  }

  const paramKey = `param_${String(field)}`;

  if (options?.caseInsensitive && typeof value === 'string') {
    query.where(`LOWER(${alias}.${String(field)}) = :${paramKey}`, {
      [paramKey]: value.trim().toLowerCase(),
    });
  } else {
    query.where(`${alias}.${String(field)} = :${paramKey}`, {
      [paramKey]: value as unknown as string | number | boolean | null,
    });
  }

  if (options?.excludeId) {
    query.andWhere(`${alias}.${idColumn} != :excludeId`, {
      excludeId: options.excludeId,
    });
  }

  const exists = await query.getOne();
  return !!exists;
}
