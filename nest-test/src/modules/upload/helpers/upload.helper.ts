import * as path from 'path';
import { ConfigService } from '@nestjs/config';
/**
 * Helper các hàm dùng chung cho MediaService khi làm việc với Uploadcare.
 * Mục tiêu: Chuẩn hoá cách xây dựng URL CDN, key lưu trữ và metadata trả về.
 */
/**
 * Lấy URL CDN của Uploadcare từ ConfigService.
 * - Ưu tiên biến cấu hình UPLOADCARE_CDN_BASE_URL nếu có.
 * - Mặc định dùng 'https://ucarecdn.com' nếu không cấu hình.
 *
 * @param configService ConfigService của NestJS
 * @returns URL CDN dạng chuỗi
 */
export function buildCdnUrl(configService: ConfigService): string {
  return (
    configService.get<string>('UPLOADCARE_CDN_BASE_URL') ||
    'https://ucarecdn.com'
  );
}

/**
 * Tạo baseKey từ tên file gốc và UUID của Uploadcare.
 * - Ví dụ: 'my-image.png' + 'abcd-1234' -> 'my-image-abcd-1234'
 * - Kết quả được chuyển hết về chữ thường.
 *
 * @param originalname Tên file gốc (bao gồm phần mở rộng)
 * @param uuid UUID trả về từ Uploadcare
 * @returns baseKey dạng 'ten-file-uuid'
 */
export function buildBaseKey(originalname: string, uuid: string): string {
  return `${path.parse(originalname).name}-${uuid}`.toLowerCase();
}

/**
 * Gắn folder (nếu có) vào baseKey để tạo thành key đầy đủ.
 * - Nếu có folder: `${folder}/${baseKey}`
 * - Nếu không có folder: trả về baseKey
 *
 * @param folder Tên thư mục (có thể undefined)
 * @param baseKey Chuỗi baseKey đã chuẩn hoá
 * @returns key đầy đủ để lưu trữ/tham chiếu
 */
export function buildKey(folder: string | undefined, baseKey: string): string {
  return folder ? `${folder}/${baseKey}` : baseKey;
}

/**
 * Xây dựng metadata chuẩn cho file sau khi upload thành công.
 * - fileId: UUID từ Uploadcare
 * - url: `${cdnUrl}/${uuid}/` (đuôi slash theo chuẩn của Uploadcare)
 * - uploadedAt: thời gian ISO string
 * - key, folder: đưa vào để tiện lưu DB/tham chiếu
 *
 * @param file Đối tượng file từ Multer
 * @param uuid UUID của file trên Uploadcare
 * @param folder Thư mục logic (theo business), có thể là role/user
 * @param cdnUrl URL CDN đã build (từ buildCdnUrl)
 * @param key Key đầy đủ đã build (từ buildKey)
 * @returns Object metadata chuẩn hoá
 */
export function buildFileData(
  file: Express.Multer.File,
  uuid: string,
  folder: string,
  cdnUrl: string,
  key: string,
): {
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  key: string;
  folder: string;
} {
  return {
    fileId: uuid,
    fileName: file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `${cdnUrl}/${uuid}/`,
    uploadedAt: new Date().toISOString(),
    key,
    folder,
  };
}

/**
 * Interface định nghĩa cấu trúc dữ liệu từ Uploadcare API
 */
interface UcFileInfo {
  uuid?: string;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
  datetimeUploaded?: string;
}

/**
 * Xây dựng metadata từ Uploadcare fileInfo (khi cần "show" thông tin file đã tồn tại).
 * @param info Kết quả từ ucFileInfo (Uploadcare REST client)
 * @param cdnUrl URL CDN (mặc định dùng buildCdnUrl)
 * @returns metadata chuẩn hoá tương tự buildFileData
 */
export function buildFileDataFromUcInfo(
  info: UcFileInfo,
  cdnUrl: string,
): {
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  key: string | undefined;
  folder: string | undefined;
} {
  const uuid: string = info?.uuid ?? '';
  return {
    fileId: uuid,
    fileName: info?.originalFilename ?? uuid,
    originalName: info?.originalFilename ?? uuid,
    mimeType: info?.mimeType ?? 'application/octet-stream',
    size: typeof info?.size === 'number' ? info.size : 0,
    url: `${cdnUrl}/${uuid}/`,
    uploadedAt: info?.datetimeUploaded ?? new Date().toISOString(),
    key: undefined,
    folder: undefined,
  };
}
