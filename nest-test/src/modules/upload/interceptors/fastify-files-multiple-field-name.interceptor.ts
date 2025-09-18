import {
  CallHandler,
  ExecutionContext,
  Inject,
  mixin,
  NestInterceptor,
  Optional,
  Type,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import FastifyMulter from 'fastify-multer';
import { Options } from 'multer';
import { Observable } from 'rxjs';

// Kiểu cho middleware function trả về từ các method của multer
type MulterMiddleware = (
  req: any,
  res: any,
  callback: (error?: unknown) => void,
) => void;

// Kiểu cụ thể hơn cho MulterInstance
interface MulterInstance {
  fields(fields: { name: string; maxCount?: number }[]): MulterMiddleware;
  array(fieldName: string, maxCount?: number): MulterMiddleware;
  single(fieldName: string): MulterMiddleware;
  any(): MulterMiddleware;
}

// Type for request with files
interface RequestWithFiles {
  body: Record<string, unknown>;
  files?: Record<string, Express.Multer.File[]>;
  file?: Express.Multer.File | Record<string, Express.Multer.File[]>;
  builtinFiles?: Record<string, Express.Multer.File[]>;
}

/**
 * Interceptor custom để xử lý upload file với Fastify + Multer.
 *
 * @param fieldConfigs - Cấu hình các field upload (vd: [{ name: 'image' }, { name: 'subImages', maxCount: 5 }]).
 * @param localOptions - Cấu hình cho Multer (vd: giới hạn dung lượng, filter loại file).
 *
 * Chức năng:
 * - Cho phép upload nhiều field trong một request (image, subImages, ...).
 * - Merge option toàn cục và option cục bộ khi khởi tạo Multer.
 * - Xử lý lỗi upload và trả về BadRequestException với message rõ ràng.
 * - Chuẩn hóa lại `req.files` và ẩn nó khỏi validation pipe (tránh recursion hoặc rò rỉ thông tin).
 * - Đảm bảo các field non-file (DTO) được truyền qua controller.
 */
export function FastifyFilesMultipleFieldInterceptor(
  fieldConfigs: { name: string; maxCount?: number }[],
  localOptions: Options = {},
) {
  class MixinInterceptor implements NestInterceptor {
    protected multer: MulterInstance;
    private readonly logger = new Logger(MixinInterceptor.name);

    constructor(
      @Optional()
      @Inject('MULTER_MODULE_OPTIONS')
      options: Options = {},
    ) {
      // Định nghĩa type an toàn cho FastifyMulter
      type FastifyMulterType = (options: Options) => MulterInstance;

      // Make sure we use memory storage for processing files
      const mergedOptions = {
        ...options,
        ...localOptions,
      };

      // Log options for debugging
      this.logger.debug('🔧 Multer options configured');

      // Create multer instance
      const multerInstance = (FastifyMulter as unknown as FastifyMulterType)(
        mergedOptions,
      );

      this.multer = multerInstance;
    }

    async intercept(
      context: ExecutionContext,
      next: CallHandler<any>,
    ): Promise<Observable<any>> {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest<RequestWithFiles>();
      const res = ctx.getResponse<unknown>(); // Log incoming request headers for debugging
      // Giải thích: Ghi log header để kiểm tra content-type và các thông tin khác, giúp debug vấn đề liên quan đến request.

      // Validate fieldConfigs
      // Giải thích: Kiểm tra fieldConfigs để đảm bảo không rỗng, tránh lỗi khi multer parse request.
      if (!fieldConfigs || fieldConfigs.length === 0) {
        this.logger.error('Chưa cấu hình field upload nào');
        throw new BadRequestException('Chưa cấu hình field upload nào');
      }
      // Convert fieldConfigs to multer format
      const multerFields = fieldConfigs.map(({ name, maxCount }) => ({
        name,
        maxCount,
      }));

      // Verify content type for multipart data (crucial for file uploads)
      // We'll use the request object we already have instead of creating a new one

      // Parse multipart form data with multer
      // Giải thích: Sử dụng multer.fields để parse các field file được chỉ định trong fieldConfigs.
      // Các field non-file (DTO) được tự động lưu vào req.body.
      try {
        await new Promise<void>((resolve, reject) => {
          this.multer.fields(multerFields)(req, res, (error: unknown) => {
            if (error) {
              // Chuyển lỗi Multer thành BadRequestException
              // Giải thích: Xử lý lỗi từ multer, lấy message chi tiết nếu có, hoặc dùng message mặc định.
              let errorMessage = 'Upload thất bại';
              if (error && typeof error === 'object' && 'message' in error) {
                const errorObj = error as { message: unknown };
                errorMessage =
                  typeof errorObj.message === 'string'
                    ? errorObj.message
                    : JSON.stringify(errorObj.message);
              }
              this.logger.error(`❌ Multer error: ${errorMessage}`);
              return reject(new BadRequestException(errorMessage));
            }
            // this.logger.debug('✅ Multer parse request thành công');
            resolve();
          });
        });
      } catch (error: unknown) {
        this.logger.error('❌ Exception during multer processing:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException('Lỗi xử lý file upload: ' + errorMessage);
      }
      // Trong FastifyFilesMultipleFieldInterceptor
      // Sanitize req.body to remove file fields
      // Log parsed body and files for debugging

      // Sanitize req.body to remove file fields
      // Giải thích: Loại bỏ các field file (image, subImages) khỏi req.body để tránh ValidationPipe lỗi.
      if (req.body) {
        fieldConfigs.forEach(({ name }) => {
          if (name in req.body) {
            delete req.body[name];
          }
        });
      }

      // Check if we actually have files
      if (
        !req.files ||
        typeof req.files !== 'object' ||
        Object.keys(req.files).length === 0
      ) {
        this.logger.warn('⚠️ No files detected in the request');
        this.logger.warn(
          '⚠️ Make sure your frontend form is correctly set up with:',
        );
        this.logger.warn(
          '⚠️ - Correct field names matching the interceptor configuration',
        );
        this.logger.warn('⚠️ - enctype="multipart/form-data" for HTML forms');
        this.logger.warn(
          '⚠️ - FormData object with append() for fetch/axios calls',
        );
      }

      // Process files and make them available to the controller
      const nestRequest = context.switchToHttp().getRequest<RequestWithFiles>();

      // Initialize files object if it doesn't exist
      const safeFiles: Record<string, Express.Multer.File[]> = {};

      if (req.files && typeof req.files === 'object') {
        // Process each file field
        for (const key of Object.keys(req.files)) {
          const files = req.files[key];

          if (Array.isArray(files)) {
            safeFiles[key] = files.map((f) => ({
              fieldname: f.fieldname,
              originalname: f.originalname,
              encoding: f.encoding,
              mimetype: f.mimetype,
              size: f.size,
              buffer: f.buffer,
              stream: f.stream,
              destination: f.destination || '',
              filename: f.filename || f.originalname || '',
              path: f.path || '',
            }));
          } else {
            this.logger.warn(`Field ${key} is not an array`);
            safeFiles[key] = [];
          }
        }
      }

      // Log the processed files
      // this.logger.debug(
      //   `📂 Processed ${Object.keys(safeFiles).length} file fields`,
      // );

      // Set files in all the places NestJS might look for them
      req.files = safeFiles;

      // These are for NestJS @UploadedFiles() decorator to work
      if (nestRequest) {
        nestRequest.files = safeFiles;

        // This is specifically for the Multer decorator
        nestRequest.file = safeFiles;

        // For built-in support
        nestRequest.builtinFiles = safeFiles;
      } // Log sanitized files
      // Giải thích: Ghi log req.files sau khi chuẩn hóa để kiểm tra dữ liệu cuối cùng trước khi truyền qua controller.
      // this.logger.debug('📂 Files after sanitization:', req.files);

      // Add verbose logging for request object
      // this.logger.debug('🔍 Body type:', typeof req.body);
      // this.logger.debug('🔍 Files type:', typeof req.files);

      // Tiếp tục pipeline
      // Giải thích: Gọi next.handle() để chuyển request sang controller, đảm bảo cả req.body và req.files được giữ nguyên.
      return next.handle();
    }
  }

  // Tạo interceptor dynamic bằng mixin
  return mixin(MixinInterceptor) as Type<NestInterceptor>;
}
