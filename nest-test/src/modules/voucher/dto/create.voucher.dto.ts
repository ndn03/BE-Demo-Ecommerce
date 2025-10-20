import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  IsDate,
  ValidateIf,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
  EVoucherStatus,
} from '@src/common/type.common';
import { Comparison } from '@src/common/decorators/comparison.decorator';

export class CreateVoucherDto {
  @ApiProperty({
    type: String,
    description: 'Mã voucher duy nhất',
    example: 'SUMMER2024',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  @MaxLength(100) // Phù hợp với entity varchar(100)
  @Expose()
  code: string;

  @ApiPropertyOptional({
    type: Number,
    description:
      'ID của campaign chứa voucher này (tùy chọn - tính năng chưa được triển khai)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  campaignId?: number;

  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Expose()
  value_discount: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    type: String,
    enum: ETypeDiscount,
    example: ETypeDiscount.PERCENTAGE,
    description: 'Loại giảm giá: PERCENTAGE, AMOUNT',
  })
  @IsNotEmpty({ message: 'discount_type should not be empty' })
  @IsEnum(ETypeDiscount, {
    message:
      'discount_type must be one of the following values: PERCENTAGE, AMOUNT',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value;
  })
  @Expose()
  discount_type: ETypeDiscount;

  @ValidateIf((o) => !o.receiverIds || o.receiverIds.length === 0)
  @Type(() => Number)
  @IsEnum(ETargetReceiverGroup)
  @ApiPropertyOptional({
    example: ETargetReceiverGroup.HUMAN_RESOURCES,
    enum: ETargetReceiverGroup,
    description:
      'Receiver group (0: ALL, 1: HR, 2: EMPLOYEE, 3: CUSTOMER, 4: ALL_CUSTOMER)',
  })
  @Expose()
  targetReceiverGroup?: ETargetReceiverGroup;

  @ValidateIf((o) => o.targetReceiverGroup === undefined)
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true, message: 'ID người nhận phải là một mảng số nguyên' })
  @ApiPropertyOptional({
    description: 'List of receiver IDs',
    example: [70, 72, 77],
  })
  @Expose()
  receiverIds?: number[];

  @ApiProperty({
    type: String,
    enum: EtargetType,
    example: EtargetType.ALL,
    description: 'Loại target sản phẩm: ALL, BRAND, CATEGORY, PRODUCT',
  })
  @IsNotEmpty({ message: 'targetType should not be empty' })
  @IsEnum(EtargetType, {
    message:
      'targetType must be one of: ALL= 0, BRAND=1, CATEGORY=2, PRODUCT=3',
  })
  @Type(() => Number)
  @Transform(({ value }) => {
    // Convert string number to actual number for enum validation
    if (typeof value === 'string') {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? value : numValue;
    }
    return value;
  })
  @Expose()
  targetType: EtargetType;

  @ApiProperty({
    type: Date,
    description: 'Thời gian bắt đầu hiệu lực',
  })
  @IsNotEmpty()
  @IsDate()
  @ValidateIf((o) => o.validFroms != null)
  @Comparison('now', 'gt', {
    message: 'Thời gian bắt đầu phải là hiện tại hoặc trong tương lai',
  })
  @Type(() => Date)
  @Expose()
  validFrom: Date;

  @ApiProperty({
    type: Date,
    description: 'Thời gian hết hạn',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Expose()
  validTo: Date;

  @Type(() => Date)
  @IsDate()
  @ValidateIf(() => false)
  private readonly now: Date = new Date();

  @ApiProperty({
    type: Number,
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Giá trị tối thiểu phải lớn hơn hoặc bằng 0' })
  @Expose()
  min_order_value?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giá trị đơn hàng tối đa để áp dụng voucher',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Giá trị tối đa phải lớn hơn hoặc bằng 1' })
  @Expose()
  max_discount_value?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giới hạn số lần sử dụng',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Giới hạn sử dụng phải lớn hơn 0' })
  @Expose()
  usage_limit?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số lần đã được sử dụng (mặc định: 0)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  used_count?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giới hạn số lần sử dụng cho mỗi người dùng (mặc định: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Giới hạn sử dụng cho mỗi người dùng phải lớn hơn 0' })
  @Expose()
  per_user_limit?: number;

  @ApiPropertyOptional({
    type: String,
    enum: EVoucherStatus,
    default: EVoucherStatus.ACTIVE,
    description: 'Trạng thái của sản phẩm',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Expose()
  status?: EVoucherStatus;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Trạng thái kích hoạt voucher',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  // @Transform(({ value }) => {
  //   if (typeof value === 'string') {
  //     return value === 'true' || value === '1';
  //   }
  //   if (typeof value === 'number') {
  //     return value === 1;
  //   }
  //   return Boolean(value);
  // })
  @Expose()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Voucher công khai (người dùng có thể tự claim)',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  // @Transform(({ value }) => {
  //   if (typeof value === 'string') {
  //     return value === 'true' || value === '1';
  //   }
  //   if (typeof value === 'number') {
  //     return value === 1;
  //   }
  //   return Boolean(value);
  // })
  @Expose()
  isPublic?: boolean;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID sản phẩm áp dụng voucher',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "1, 2, 3"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter(Boolean);
    }

    // Nếu gửi dạng mảng: [1, 2, 3] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }
    // Nếu không gửi gì → hiểu là ALL
    if (value === undefined || value === null || value === '') {
      return null;
    }
  })
  @Expose()
  list_targetType?: number[];
}
