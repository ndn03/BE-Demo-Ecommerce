import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadMediaDto {
  @ApiProperty({ type: String, format: 'binary' })
  file: string;
}

export class UploadMultipleFilesDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description:
      'Array of files to upload (send under the same field name: files)',
  })
  files: string[];
}

export class DeleteFileFromUploadcareDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  fileId: string;
}

export class DeleteFilesFromUploadcareDto {
  @ApiProperty({ type: [String], required: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  fileIds: string[]; // Thay vì 'keys' → 'fileIds'
}

export class DuplicateFileFromUploadcareDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  fileId: string; // Source file ID để duplicate
}
