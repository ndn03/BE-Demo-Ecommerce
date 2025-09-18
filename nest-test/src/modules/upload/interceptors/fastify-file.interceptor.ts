import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  mixin,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

export interface FastifyFileInterceptorOptions {
  fieldName?: string;
  limits?: {
    fileSize?: number;
    files?: number;
  };
  fileFilter?: (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => void;
}

/**
 * Interceptor Fastify đọc 1 file multipart và chuyển thành Express.Multer.File.
 * - Tự chuyển stream -> buffer
 * - Hỗ trợ giới hạn kích thước và truyền fileFilter để validate
 */
export function FastifyFileInterceptor(
  fieldName: string = 'file',
  options: FastifyFileInterceptorOptions = {},
) {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    async intercept(
      context: ExecutionContext,
      next: CallHandler<any>,
    ): Promise<Observable<any>> {
      // Just use FastifyRequest directly, and we'll add the file property with Object.defineProperty
      const request = context.switchToHttp().getRequest<FastifyRequest>();

      try {
        // console.log('🔄 FastifyFileInterceptor bắt đầu xử lý...');

        // ✅ Helper để convert stream to buffer
        const streamToBuffer = (
          stream: NodeJS.ReadableStream,
        ): Promise<Buffer> => {
          return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => {
              if (Buffer.isBuffer(chunk)) {
                chunks.push(chunk);
              } else {
                // Ensure chunk is string or ArrayBuffer-like before converting
                chunks.push(Buffer.from(chunk as ArrayBufferLike));
              }
            });
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', (err) => {
              reject(err instanceof Error ? err : new Error(String(err)));
            });
          });
        };

        // Dùng request.parts() để đọc cả field và file
        const parts = request.parts();
        const body: Record<string, any> = {};
        let uploadedFile: Express.Multer.File | null = null;

        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === fieldName) {
            //  Convert stream to buffer - FIX: Await properly
            let buffer: Buffer;
            try {
              // console.log('🔄 Đang chuyển đổi stream thành buffer...');
              buffer = await streamToBuffer(part.file);
              // console.log(
              //   'Chuyển đổi buffer thành công, kích thước:',
              //   buffer.length,
              // );
            } catch (bufferError) {
              console.error('❌ Chuyển đổi buffer thất bại:', bufferError);
              throw new BadRequestException('Không thể xử lý luồng file');
            }

            // ✅ Create Express.Multer.File format - FIX: Proper assignment
            const file: Express.Multer.File = {
              fieldname: part.fieldname || fieldName,
              originalname: part.filename || '',
              encoding: part.encoding || '7bit',
              mimetype: part.mimetype || 'application/octet-stream',
              size: buffer.length,
              buffer: buffer,
              stream: part.file,
              destination: '',
              filename: part.filename || '',
              path: '',
            };

            // console.log('Express.Multer.File created:', {
            //   fieldname: file.fieldname,
            //   originalname: file.originalname,
            //   mimetype: file.mimetype,
            //   size: file.size,
            //   hasBuffer: !!file.buffer,
            //   bufferLength: file.buffer?.length,
            // });

            // File size validation
            if (
              options.limits?.fileSize &&
              file.size > options.limits.fileSize
            ) {
              const sizeMB = (options.limits.fileSize / (1024 * 1024)).toFixed(
                2,
              );
              throw new BadRequestException(
                `File size exceeds limit of ${sizeMB}MB`,
              );
            }

            // File filter validation
            if (options.fileFilter) {
              // FIX: Ensure file filter works properly
              const isValidFile = await new Promise<boolean>(
                (resolve, reject) => {
                  try {
                    options.fileFilter(request, file, (error, acceptFile) => {
                      if (error) {
                        console.log('❌ File filter error:', error.message);
                        reject(
                          error instanceof Error
                            ? error
                            : new Error(String(error)),
                        );
                      } else {
                        console.log(
                          '✅ Kết quả kiểm tra file filter:',
                          acceptFile,
                        );
                        resolve(acceptFile);
                      }
                    });
                  } catch (filterError) {
                    console.error('❌ File filter exception:', filterError);
                    reject(new BadRequestException('File filter failed'));
                  }
                },
              );

              if (!isValidFile) {
                throw new BadRequestException('File type not allowed');
              }
            }

            uploadedFile = file;
          }

          // Nếu là field text thì thêm vào body
          if (part.type === 'field') {
            body[part.fieldname] = part.value;
          }
        }

        // Attach file to request for @UploadedFile() decorator using defineProperty
        // This avoids TypeScript errors with direct property assignment
        Object.defineProperty(request, 'file', {
          value: uploadedFile,
          writable: true,
          configurable: true,
          enumerable: false,
        });

        // Attach body (tất cả các field text) vào request
        Object.defineProperty(request, 'body', {
          value: body,
          writable: true,
          configurable: true,
        });

        console.log('FastifyFileInterceptor completed successfully');
        // console.log(
        //   '📎 File attached to request:',
        //   uploadedFile && {
        //     originalname: uploadedFile.originalname,
        //     size: uploadedFile.size,
        //     mimetype: uploadedFile.mimetype,
        //   },
        // );
        // console.log('📤 Body attached to request:', body);
      } catch (error) {
        console.error('❌ FastifyFileInterceptor error:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Set file as null on error using defineProperty
        Object.defineProperty(request, 'file', {
          value: null,
          writable: true,
          configurable: true,
          enumerable: false,
        });

        // Re-throw the error
        if (error instanceof BadRequestException) {
          throw error;
        }

        throw new BadRequestException(
          error instanceof Error ? error.message : 'File processing failed',
        );
      }

      return next.handle();
    }
  }

  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
}
