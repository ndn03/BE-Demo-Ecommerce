import {
  CallHandler,
  ExecutionContext,
  Inject,
  mixin,
  NestInterceptor,
  Optional,
  Type,
} from '@nestjs/common';
import { Multer, Options } from 'multer';
import FastifyMulter from 'fastify-multer';
import { Observable } from 'rxjs';

// Định nghĩa interface cho MulterInstance để tránh sử dụng any
interface MulterInstance {
  array(
    fieldName: string,
    maxCount?: number,
  ): (req: any, res: any, callback: (error?: any) => void) => void;
  single(
    fieldName: string,
  ): (req: any, res: any, callback: (error?: any) => void) => void;
  fields(
    fields: { name: string; maxCount?: number }[],
  ): (req: any, res: any, callback: (error?: any) => void) => void;
  any(): (req: any, res: any, callback: (error?: any) => void) => void;
}

/**
 * Interceptor Fastify cho phép đọc nhiều file từ multipart (field dạng array).
 * - Sử dụng fastify-multer để parse và gắn files vào request
 * - Tương thích với @UploadedFiles() của NestJS
 */
export function FastifyFilesInterceptor(
  fieldName: string,
  maxCount?: number,
  localOptions?: Options,
) {
  /**
   * Lớp interceptor mixin thực thi logic parse files và chuyển tiếp request
   */
  class MixinInterceptor implements NestInterceptor {
    protected multer: MulterInstance;
    constructor(
      @Optional()
      @Inject('MULTER_MODULE_OPTIONS')
      options: Multer,
    ) {
      // Định nghĩa type cụ thể cho FastifyMulter
      type FastifyMulterType = (options: Options) => MulterInstance;

      // Sử dụng type assertion an toàn hơn
      this.multer = (FastifyMulter as unknown as FastifyMulterType)({
        ...options,
        ...localOptions,
      });
    }

    /**
     * Parse mảng files từ fieldName (tối đa maxCount) và gắn vào request
     */
    async intercept(
      context: ExecutionContext,
      next: CallHandler<any>,
    ): Promise<Observable<any>> {
      const ctx = context.switchToHttp();

      await new Promise<void>((resolve, reject) =>
        this.multer.array(fieldName, maxCount)(
          ctx.getRequest(),
          ctx.getResponse(),
          (error: any) => {
            if (error) {
              return reject(
                error instanceof Error ? error : new Error(String(error)),
              );
            }
            resolve();
          },
        ),
      );

      // Sanitize and hide files from enumeration to prevent ValidationPipe recursion
      const req = ctx.getRequest<{ files?: Express.Multer.File[] }>();
      if (Array.isArray(req?.files)) {
        // Helper to safely extract a string property from an unknown object
        const getStringProp = (obj: unknown, key: string): string => {
          if (obj && typeof obj === 'object') {
            const val = (obj as Record<string, unknown>)[key];
            return typeof val === 'string' ? val : '';
          }
          return '';
        };
        try {
          const safeFiles = req.files.map((f) => ({
            fieldname: f.fieldname,
            originalname: f.originalname,
            encoding: f.encoding,
            mimetype: f.mimetype,
            size: f.size,
            buffer: f.buffer,
            destination: getStringProp(f, 'destination'),
            filename: f.filename ?? f.originalname ?? '',
            path: getStringProp(f, 'path'),
          }));

          Object.defineProperty(req, 'files', {
            value: safeFiles,
            writable: true,
            configurable: true,
            enumerable: false, // avoid being traversed by ValidationPipe
          });
        } catch {
          // If sanitization fails, ensure files is at least non-enumerable
          Object.defineProperty(req, 'files', {
            value: req.files,
            writable: true,
            configurable: true,
            enumerable: false,
          });
        }
      }

      return next.handle();
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
}
