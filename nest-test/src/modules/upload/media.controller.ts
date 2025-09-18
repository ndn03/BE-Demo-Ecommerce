import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { FileUploadHelper } from './helpers/file-upload';
import { FastifyFileInterceptor } from './interceptors/fastify-file.interceptor';
import { FastifyFilesInterceptor } from './interceptors/fastify-files.interceptor';
import { ALLOWED_MIME_TYPES } from 'src/configs/const.config';
import {
  UploadMediaDto,
  UploadMultipleFilesDto,
  DeleteFilesFromUploadcareDto,
  DeleteFileFromUploadcareDto,
} from './dto/upload-media.dto';
import { User } from '@src/entities/user.entity';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import { ERole } from '@configs/role.config';

/**
 * Controller Media xử lý các API upload/download và quản lý file (Uploadcare).
 * - Sử dụng Fastify Interceptor để đọc file multipart và chuyển về Express.Multer.File
 * - Áp dụng kiểm tra (validation) loại file, kích thước và phân quyền người dùng
 */
@ApiTags('Media')
@Controller('v1/media')
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload 1 file duy nhất lên Uploadcare.
   * - Giới hạn kích thước: 10MB
   * - Chỉ chấp nhận các mime-types nằm trong ALLOWED_MIME_TYPES
   * - Quyền: HR hoặc ADMIN
   */
  @Post('upload/single')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, callback) => {
        FileUploadHelper.fileFilter(
          req,
          file,
          callback,
          ALLOWED_MIME_TYPES,
          'Invalid file type.',
        );
      },
    }),
  )
  @ApiOperation({
    summary: `[${ERole.ADMINISTRATOR}] Upload single file`,
    description: 'Upload a single file with validation and optional parameters',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Single file upload with optional parameters',
    type: UploadMediaDto,
  })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadMediaDto,
    @AuthUser() user: User,
  ) {
    try {
      // Interceptor đã xử lý tất cả validation, chỉ cần check basic
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname) {
        throw new BadRequestException('Invalid file - missing original name');
      }
      // Additional business validation nếu cần
      if (file.size === 0) {
        throw new BadRequestException('File is empty');
      }

      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('File buffer is invalid');
      }

      const result = await this.mediaService.uploadFile(
        file,
        user.role.toString(),
      );

      console.log('✅ Upload successful:', {
        fileId: result.fileData.fileId,
        // fileName: result.fileData.fileName,
        // size: result.fileData.size,
        url: result.fileData.url,
      });

      return {
        message: 'File uploaded successfully',
        data: result.fileData,
      };
    } catch (error) {
      console.error('Upload error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: user?.username || 'unknown',
        timestamp: new Date().toISOString(),
        fileInfo: file
          ? {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            }
          : 'No file provided',
      });

      // Return user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload file';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Upload nhiều file lên Uploadcare (tối đa 10 file/lần).
   * - Giới hạn kích thước mỗi file: 10MB
   * - Kiểm tra định dạng từng file bằng FileUploadHelper
   * - Quyền: HR hoặc ADMIN
   */
  @Post('upload/multiple')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @UseInterceptors(
    FastifyFilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        FileUploadHelper.fileFilter(
          req,
          file,
          callback,
          ALLOWED_MIME_TYPES,
          'Invalid file type.',
        );
      },
    }),
  )
  @ApiOperation({
    summary: `[${ERole.ADMINISTRATOR}] Upload multiple files`,
  })
  @ApiConsumes('multipart/form-data')
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() _body: UploadMultipleFilesDto,
    @AuthUser() user: User,
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      // console.log(
      //   '✅ [multiple] Files received from interceptor:',
      //   files.map((f) => ({
      //     originalname: f.originalname,
      //     mimetype: f.mimetype,
      //     size: f.size,
      //   })),
      // );

      FileUploadHelper.validationFilesBeforeUpload(files, ALLOWED_MIME_TYPES);

      const results = await this.mediaService.uploadFiles(
        files,
        user.role.toString(),
      );

      // console.log('✅ [multiple] Upload successful:', results.length, 'files');
      return {
        message: 'Files uploaded successfully',
        data: results.map((r) => r.fileData),
        count: results.length,
      };
    } catch (error) {
      console.error('Multiple upload error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: user?.username || 'unknown',
        timestamp: new Date().toISOString(),
        filesCount: files?.length || 0,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload files';
      throw new BadRequestException(errorMessage);
    }
  }
  /**
   * Lấy thông tin nhiều file từ Uploadcare theo danh sách IDs.
   * - Dùng khi client đã có các fileId và cần hiển thị metadata.
   */
  @Post('files/info')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Get info for multiple files by IDs (Uploadcare)' })
  async getFilesInfo(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids is required');
    }
    const { data, failed } = await this.mediaService.getFilesInfo(ids);
    return {
      message: 'Fetched files info',
      data,
      failed,
      count: data.length,
    };
  }

  /**
   * Liệt kê danh sách file đã upload từ Uploadcare.
   * - Hỗ trợ các tham số: ordering, stored, removed, from.
   */
  @Get('files')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'List uploaded files (Uploadcare)' })
  async listFiles(
    @Query() query: import('./dto/query.upload.dto').ListFilesQueryDto,
  ) {
    const result = await this.mediaService.listAllFiles(query);
    return result;
  }

  /**
   * Rollback (xóa) các file trên Uploadcare theo danh sách fileIds.
   * - Dùng để dọn dẹp khi upload nhiều file nhưng xảy ra lỗi một phần.
   */
  @Post('uploadcare/rollback')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Rollback uploaded files on Uploadcare (delete by IDs)',
  })
  async rollbackUploadcare(@Body() body: DeleteFilesFromUploadcareDto) {
    const { fileIds } = body || ({} as DeleteFilesFromUploadcareDto);
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new BadRequestException('fileIds is required');
    }

    const { deleted, failed } = await this.mediaService.rollbackFile(fileIds);
    return {
      message: 'Rollback completed',
      deleted,
      failed,
      deletedCount: deleted.length,
      failedCount: failed.length,
    };
  }

  /**
   * Xóa 1 file đơn từ Uploadcare bằng fileId.
   */
  @Delete('uploadcare/delete')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Delete a single file on Uploadcare' })
  async deleteSingle(@Body() body: DeleteFileFromUploadcareDto) {
    const { fileId } = body || ({} as DeleteFileFromUploadcareDto);
    if (!fileId) throw new BadRequestException('fileId is required');
    await this.mediaService.deleteFile(fileId);
    return { message: 'File deleted', deleted: [fileId] };
  }

  /**
   * Xóa nhiều file trên Uploadcare theo danh sách fileIds.
   */
  @Delete('uploadcare/delete-many')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Delete multiple files on Uploadcare' })
  async deleteMany(@Body() body: DeleteFilesFromUploadcareDto) {
    const { fileIds } = body || ({} as DeleteFilesFromUploadcareDto);
    if (!Array.isArray(fileIds) || fileIds.length === 0)
      throw new BadRequestException('fileIds is required');
    const { deleted, failed } =
      await this.mediaService.deleteMultipleFiles(fileIds);
    return {
      message: 'Delete completed',
      deleted,
      failed,
      deletedCount: deleted.length,
      failedCount: failed.length,
    };
  }

  /**
   * Lấy URL tải trực tiếp (CDN) cho 1 file trên Uploadcare.
   * - Có thể truyền kèm filename mong muốn khi tải.
   */
  @Post('download')
  @HttpCode(HttpStatus.OK)
  @Auth(ERole.HUMAN_RESOURCES, ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Get direct CDN URL for a file on Uploadcare' })
  @ApiBody({
    description:
      'Provide file id (Uploadcare UUID) and optional preferred filename',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Uploadcare file UUID' },
        filename: {
          type: 'string',
          description: 'Preferred download filename',
        },
      },
      required: ['id'],
    },
  })
  async download(@Body('id') id: string, @Body('filename') filename?: string) {
    if (!id) throw new BadRequestException('id is required');
    const url = await Promise.resolve(
      this.mediaService.getDownloadUrl(id, filename),
    );
    return { url };
  }
}

///VScode debug nestjs
