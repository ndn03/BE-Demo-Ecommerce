import { BadRequestException } from '@nestjs/common';
import { ALLOWED_MIME_TYPES } from 'src/configs/const.config';
import { isArray } from 'class-validator';
// import * as multer from 'multer';
/**
 * Helper xử lý validate và filter file upload cho Fastify/Multer.
 * - Cung cấp các hàm fileFilter/filesFilter để tích hợp với interceptor
 * - Hỗ trợ validate trước khi upload (đơn và nhiều file)
 */
export class FileUploadHelper {
  /**
   * Bộ lọc cho 1 file (áp dụng cho upload đơn lẻ)
   * - Kiểm tra mimetype so với danh sách cho phép
   *
   * @param _req any - request object (không dùng)
   * @param file Express.Multer.File - thông tin file từ Multer
   * @param cb (error, acceptFile) - callback theo chuẩn Multer
   * @param allowMimeTypes Danh sách mime-types cho phép
   * @param message Thông điệp lỗi tuỳ chỉnh
   */
  static fileFilter = (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
    allowMimeTypes: Array<string> = ALLOWED_MIME_TYPES,
    message?: string,
  ) => {
    if (!allowMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException({
          message: message || 'The file is not allowed.',
        }),
        false,
      );
    }
    callback(null, true);
  };

  /**
   * Bộ lọc cho nhiều field file (áp dụng khi có nhiều field khác nhau)
   * - Kiểm tra theo cấu hình allowMimeTypes cho từng field
   *
   * @param _req any - request object (không dùng)
   * @param file Express.Multer.File - thông tin file từ Multer
   * @param cb (error, acceptFile) - callback theo chuẩn Multer
   * @param allowMimeTypes Record<string, { mimeTypes: string[]; message?: string }>
   */
  static filesFilter = (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
    allowMimeTypes: Record<
      string,
      { mimeTypes: Array<string>; message?: string }
    >,
  ) => {
    const allowedTypes = allowMimeTypes[file.fieldname].mimeTypes;
    const message = allowMimeTypes[file.fieldname].message;
    if (!allowedTypes || !allowedTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException({
          message:
            message || `File type of "${file.fieldname}" is not allowed.`,
        }),
        false,
      );
    }
    callback(null, true);
  };

  /**
   * Validate nhiều file trước khi upload
   * - Đảm bảo có ít nhất 1 file và tất cả đều có mimetype hợp lệ
   *
   * @param files Array<Express.Multer.File>
   * @param allowMimeTypes string[] - danh sách mime-types cho phép
   * @param message Thông điệp lỗi tuỳ chỉnh
   */
  static validationFilesBeforeUpload(
    files: Array<Express.Multer.File>,
    allowMimeTypes: Array<string> = ALLOWED_MIME_TYPES,
    message?: string,
  ): void {
    if (!isArray(files) || (isArray(files) && files?.length <= 0))
      throw new BadRequestException({ message: 'No files provided.' });
    let isFile = true;
    files.forEach((f) => {
      if (!allowMimeTypes.includes(f.mimetype)) {
        isFile = false;
        return;
      }
    });
    if (!isFile)
      throw new BadRequestException({
        message: message || 'File is not allowed.',
      });
  }

  /**
   * Validate 1 file trước khi upload
   * - Kiểm tra tồn tại và mimetype hợp lệ
   *
   * @param file Express.Multer.File
   * @param allowMimeTypes string[] - danh sách mime-types cho phép
   * @param message Thông điệp lỗi tuỳ chỉnh
   */
  static validationFileBeforeUpload(
    file: Express.Multer.File,
    allowMimeTypes: Array<string> = ALLOWED_MIME_TYPES,
    message?: string,
  ): void {
    if (!file) throw new BadRequestException({ message: 'File is required.' });
    if (!allowMimeTypes.includes(file.mimetype))
      throw new BadRequestException({
        message: message || 'File is not allowed.',
      });
  }
}
