import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
// import { PutObjectCommandOutput } from '@aws-sdk/client-s3';

import { UploadClient } from '@uploadcare/upload-client';
import {
  UploadcareSimpleAuthSchema,
  deleteFile as ucDeleteFile,
  fileInfo as ucFileInfo,
  listOfFiles as ucListOfFiles,
  ListOfFilesOrdering,
} from '@uploadcare/rest-client';
import { ConfigService } from '@nestjs/config';
import {
  buildCdnUrl,
  buildBaseKey,
  buildKey,
  buildFileData,
  buildFileDataFromUcInfo,
} from './helpers/upload.helper';

/**
 * Service Media làm việc với Uploadcare.
 * - Chịu trách nhiệm upload/xóa/lấy thông tin file và build metadata trả về
 * - Đảm bảo xử lý lỗi hợp lý và hỗ trợ rollback khi upload nhiều file
 */
@Injectable()
export class MediaService {
  private readonly uploadClient: UploadClient;
  private readonly authSchema: UploadcareSimpleAuthSchema;

  constructor(private configService: ConfigService) {
    this.uploadClient = new UploadClient({
      publicKey: this.configService.get('UPLOADCARE_PUBLIC_KEY'),
    });

    this.authSchema = new UploadcareSimpleAuthSchema({
      publicKey: this.configService.get('UPLOADCARE_PUBLIC_KEY'),
      secretKey: this.configService.get('UPLOADCARE_SECRET_KEY'),
    });
  }

  /**
   * Tạo tên file duy nhất để tránh ghi đè (kết hợp timestamp + uuid ngắn).
   */
  private uniqueFileName(file: Express.Multer.File): string {
    const parse = path.parse(file.originalname);
    const uniqueFile = `${dayjs().valueOf()}-${uuidv4().substring(0, 8)}`;
    return `${parse.name}-${uniqueFile}${parse.ext}`.toLowerCase();
  }

  /**
   * Upload file buffer lên Uploadcare.
   * @param file File đã đọc từ multipart (Express.Multer.File)
   * @param useUniqueFileName Có tự động đổi tên file để tránh trùng lặp hay không
   */
  async uploadToUploadcare(
    file: Express.Multer.File,
    useUniqueFileName: boolean = true,
  ) {
    // Giảm timeout để phát hiện sớm các vấn đề kết nối
    const UPLOAD_TIMEOUT_MS = 30000; // 30 giây timeout cho upload

    const filename = useUniqueFileName
      ? this.uniqueFileName(file)
      : file.originalname;

    // console.log(
    //   `📤 Bắt đầu upload file "${filename}" lên Uploadcare (timeout: ${UPLOAD_TIMEOUT_MS / 1000}s)`,
    // );

    // Tạo một promise riêng cho upload để có thể cancel nếu cần
    const uploadPromise = this.uploadClient.uploadFile(file.buffer, {
      fileName: filename,
      contentType: file.mimetype,
      // Thêm store=auto để file tự động lưu trữ trên Uploadcare
      store: 'auto',
    });

    // Tạo một timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Upload timeout after ${UPLOAD_TIMEOUT_MS / 1000} seconds`),
        );
      }, UPLOAD_TIMEOUT_MS);

      // Ensure the timeout is cleared if uploadPromise resolves first
      uploadPromise
        .then(() => clearTimeout(timeoutId))
        .catch(() => clearTimeout(timeoutId));
    });

    // Race giữa upload và timeout
    return Promise.race([uploadPromise, timeoutPromise]);
  }

  /**
   * Upload 1 file và trả về metadata chuẩn hoá kèm URL CDN.
   * @param file File đầu vào (đã được interceptor đọc là buffer)
   * @param folder Thư mục logic để build key (ví dụ: role của user)
   */
  // New optimized single-file upload with clean, minimal logic
  async uploadFile(file: Express.Multer.File, folder: string) {
    try {
      // Validate file trước khi upload (fail fast)
      if (!file || !file.buffer) {
        throw new HttpException(
          'Invalid file or empty buffer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Track performance và add context vào logs
      // context reserved for future tracing
      const result = await this.uploadToUploadcare(file).catch((error: any) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          typeof (error as { message?: unknown }).message === 'string'
        ) {
          const errMsg = (error as { message: string }).message;
          if (errMsg.includes('size')) {
            throw new HttpException(
              'File size exceeds limit',
              HttpStatus.PAYLOAD_TOO_LARGE,
            );
          }
          if (errMsg.includes('type') || errMsg.includes('format')) {
            throw new HttpException(
              'Unsupported file format',
              HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            );
          }
        }
        throw error;
      });

      // Generate unique key for the file, include folder if provided
      const baseKey = buildBaseKey(file.originalname, result.uuid);
      const key = buildKey(folder, baseKey);
      const cdnUrl: string = buildCdnUrl(this.configService);

      // Tạo url đúng chuẩn, thêm preview nếu muốn

      // Return both result object and key
      return {
        result,
        key,
        fileData: buildFileData(file, result.uuid, folder, cdnUrl, key),
      };
    } catch (error) {
      // Return appropriate HTTP exception
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to upload file: ${
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : 'Unknown error'
        }`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Upload nhiều file một lúc và tự động rollback nếu có file thất bại.
   * @param files Danh sách file cần upload
   * @param folder Thư mục logic để build key
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<
    {
      result: any;
      key: string;
      fileData: {
        fileId: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        uploadedAt: string;
        key: string;
        folder: string;
      };
    }[]
  > {
    // Validate list before upload
    if (!Array.isArray(files) || files.length === 0) {
      throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
    }

    // Upload concurrently but capture results to support rollback
    const settled = await Promise.allSettled(
      files.map((file) => this.uploadFile(file, folder)),
    );

    const succeeded: {
      result: any;
      key: string;
      fileData: {
        fileId: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        uploadedAt: string;
        key: string;
        folder: string;
      };
    }[] = [];
    const uploadedIds: string[] = [];
    let firstError: string | null = null;

    settled.forEach((res) => {
      if (res.status === 'fulfilled') {
        succeeded.push(res.value);
        uploadedIds.push(res.value.fileData.fileId);
      } else {
        const reason: unknown = res.reason;
        let msg = 'Failed to upload one or more files';
        if (
          typeof reason === 'object' &&
          reason !== null &&
          'message' in reason &&
          typeof (reason as { message?: unknown }).message === 'string'
        ) {
          msg = (reason as { message: string }).message;
        }
        firstError = firstError || msg;
      }
    });

    if (firstError) {
      // Rollback successfully uploaded files
      if (uploadedIds.length > 0) {
        await this.rollbackFile(uploadedIds);
      }
      throw new HttpException(firstError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return succeeded;
  }

  /**
   * Xóa nhiều file theo IDs (dùng cho rollback).
   * Trả về danh sách id đã xóa và các phần tử thất bại kèm lý do.
   */
  async rollbackFile(
    fileIds: string[],
  ): Promise<{ deleted: string[]; failed: { id: string; error: string }[] }> {
    const results = await Promise.allSettled(
      fileIds.map((id) =>
        ucDeleteFile({ uuid: id }, { authSchema: this.authSchema }),
      ),
    );

    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    results.forEach((res, idx) => {
      const id = fileIds[idx];
      if (res.status === 'fulfilled') {
        deleted.push(id);
      } else {
        const reason: unknown = res.reason;
        let message = 'Unknown error';
        if (
          typeof reason === 'object' &&
          reason !== null &&
          'message' in reason &&
          typeof (reason as { message?: unknown }).message === 'string'
        ) {
          message = (reason as { message: string }).message;
        } else if (reason !== undefined) {
          try {
            if (typeof reason === 'object') {
              message = JSON.stringify(reason);
            } else {
              message = JSON.stringify(reason);
            }
          } catch {
            message = 'Unknown error';
          }
        }
        failed.push({ id, error: message });
      }
    });

    return { deleted, failed };
  }

  /**
   * Xóa 1 file trên Uploadcare theo fileId.
   * @param fileId UUID của file trên Uploadcare hoặc URL CDN đầy đủ
   * @returns Kết quả xóa file
   */
  async deleteFile(fileId: string | null | undefined) {
    // Skip if file ID is empty
    if (!fileId) {
      // console.log('⚠️ No file ID provided, skipping delete operation');
      return { success: false, reason: 'Empty fileId' };
    }

    try {
      // Extract UUID from URL if needed
      const uuid = this.extractUuidFromFileId(fileId);

      // console.log(`🗑️ Deleting file from Uploadcare: ${uuid}`);

      // Call Uploadcare API to delete the file
      const result = await ucDeleteFile(
        { uuid },
        { authSchema: this.authSchema },
      );

      console.log(`✅ File deleted successfully: ${uuid}`);
      return result;
    } catch (error) {
      // Handle error and log it
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error deleting file ${fileId}:`, message);

      throw new HttpException(
        `Failed to delete file: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extract UUID from fileId or URL
   */
  private extractUuidFromFileId(fileId: string): string {
    // Handle URL case - extract UUID part
    if (fileId.includes('/')) {
      const parts = fileId.split('/');

      // Find part that looks like a UUID
      for (const part of parts) {
        // Simple check for UUID format
        if (part && part.length >= 32 && part.includes('-')) {
          // Looks like a UUID
          return part;
        }
      }
    }

    // Return original if not a URL or UUID not found
    return fileId;
  }

  async deleteMultipleFiles(fileIds: string[]) {
    const results = await Promise.allSettled(
      fileIds.map((id) => this.deleteFile(id)),
    );
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];
    results.forEach((res, idx) => {
      const id = fileIds[idx];
      if (res.status === 'fulfilled') {
        deleted.push(id);
      } else {
        const reason: unknown = res.reason;
        let message = 'Failed to delete file';
        if (
          typeof reason === 'object' &&
          reason !== null &&
          'message' in reason &&
          typeof (reason as { message?: unknown }).message === 'string'
        ) {
          message = (reason as { message: string }).message;
        }
        failed.push({ id, error: message });
      }
    });
    return { deleted, failed };
  }

  getDownloadUrl(fileId: string, filename?: string) {
    const cdnUrl = buildCdnUrl(this.configService);
    const suffix = filename
      ? `-/inline/yes/${encodeURIComponent(filename)}`
      : '';
    return `${cdnUrl}/${fileId}/` + suffix;
  }

  async getFileInfo(fileId: string) {
    try {
      return await ucFileInfo(
        { uuid: fileId },
        { authSchema: this.authSchema },
      );
    } catch {
      throw new HttpException(
        'Failed to get file info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFilesInfo(fileIds: string[]) {
    // Lấy base url đúng từ biến môi trường
    const uploadBaseUrl =
      this.configService.get<string>('UPLOADCARE_CDN_BASE_URL') ||
      'https://ucarecdn.com';
    const settled = await Promise.allSettled(
      fileIds.map((id) =>
        ucFileInfo({ uuid: id }, { authSchema: this.authSchema }),
      ),
    );

    const data: ReturnType<typeof buildFileDataFromUcInfo>[] = [];
    const failed: { id: string; error: string }[] = [];

    settled.forEach((res, idx) => {
      const id = fileIds[idx];
      if (res.status === 'fulfilled') {
        // Truyền uploadBaseUrl vào buildFileDataFromUcInfo
        data.push(buildFileDataFromUcInfo(res.value, uploadBaseUrl));
      } else {
        const reason: unknown = res.reason;
        let message = 'Failed to fetch file info';
        if (
          typeof reason === 'object' &&
          reason !== null &&
          'message' in reason &&
          typeof (reason as { message?: unknown }).message === 'string'
        ) {
          message = (reason as { message: string }).message;
        }
        failed.push({
          id,
          error: message,
        });
      }
    });

    return { data, failed };
  }

  async listAllFiles(query?: {
    limit?: number;
    ordering?: ListOfFilesOrdering;
    stored?: boolean;
    removed?: boolean;
    from?: Date;
  }) {
    const cdnUrl = buildCdnUrl(this.configService);
    const {
      limit = 100,
      ordering = '-datetime_uploaded',
      stored,
      removed,
      from,
    } = query || {};

    try {
      const response = await ucListOfFiles(
        {
          limit,
          ordering,
          ...(typeof stored === 'boolean' ? { stored } : {}),
          ...(typeof removed === 'boolean' ? { removed } : {}),
          ...(from instanceof Date ? { from } : {}),
        },
        { authSchema: this.authSchema },
      );

      const items = (response.results || []).map((info) =>
        buildFileDataFromUcInfo(info, cdnUrl),
      );

      return {
        message: 'Fetched uploaded files',
        data: items,
        count: items.length,
        next: response.next,
        previous: response.previous,
        totals:
          (
            response as unknown as {
              totals?: { removed: number; stored: number; unstored: number };
            }
          ).totals ?? null,
      };
    } catch {
      throw new HttpException(
        'Failed to list files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
