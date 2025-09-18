import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { QueryPaginateDto } from 'src/common/dtos/query.dto';
import { ListOfFilesOrdering } from '@uploadcare/rest-client';

/**
 * DTO Query cho API liệt kê file đã upload (GET /v1/media/files).
 * - Kế thừa QueryPaginateDto để tái sử dụng các tham số phân trang: page, limit, search, isPagination.
 * - Bổ sung các tham số lọc đặc thù của Uploadcare: ordering, stored, removed, from.
 *
 * Lưu ý:
 * - Uploadcare sử dụng cơ chế phân trang dựa trên con trỏ (cursor) thông qua tham số `from`.
 *   Vì vậy `page` có thể không có tác dụng trực tiếp như phân trang truyền thống, nhưng vẫn giữ
 *   để đồng bộ với chuẩn QueryPaginateDto của dự án.
 */
export class ListFilesQueryDto extends PartialType(QueryPaginateDto) {
  /**
   * Thứ tự sắp xếp theo thời gian upload.
   * - Giá trị hợp lệ: 'datetime_uploaded' | '-datetime_uploaded'
   * - Mặc định: '-datetime_uploaded' (mới nhất trước)
   */
  @ApiPropertyOptional({
    enum: ['datetime_uploaded', '-datetime_uploaded'],
    default: '-datetime_uploaded',
  })
  @IsOptional()
  @Expose()
  @IsEnum([
    'datetime_uploaded',
    '-datetime_uploaded',
  ] as unknown as ListOfFilesOrdering[])
  ordering?: ListOfFilesOrdering;
  /**
   * Lọc theo trạng thái đã xóa (removed).
   * - Nhận cả chuỗi 'true'/'false' hoặc boolean thực.
   */

  /**
   * Mốc thời gian bắt đầu (cursor) cho phân trang theo Uploadcare.
   * - Nhận chuỗi ngày giờ ISO, sẽ được chuyển sang Date.
   */
  @ApiPropertyOptional({ type: String, description: 'ISO date string' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  })
  @Type(() => Date)
  @IsDate()
  from?: Date;
}
