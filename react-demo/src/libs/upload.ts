import { NError } from '@configs/const.config';
import { MIME_TYPES } from '@utils/mime-type';
import { notification, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';

// UploadCare configuration
const UPLOADCARE_PUBLIC_KEY =
  process.env.VITE_UPLOADCARE_PUBLIC_KEY || 'your-public-key';

// UploadCare upload function
export const uploadToUploadCare = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
  formData.append('UPLOADCARE_STORE', 'auto');
  formData.append('file', file);

  try {
    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.file; // Returns file UUID
  } catch (error) {
    console.error('UploadCare upload error:', error);
    throw error;
  }
};

export const beforeUpload = (file: RcFile) => {
  const isAccess = [
    MIME_TYPES.jpg,
    MIME_TYPES.jpeg,
    MIME_TYPES.png,
    MIME_TYPES.gif,
    MIME_TYPES.mp4,
    MIME_TYPES.movie,
    MIME_TYPES.avi,
    MIME_TYPES.flv,
    MIME_TYPES.webm,
    MIME_TYPES.mts,
    MIME_TYPES.mpeg,
    MIME_TYPES.csv,
    MIME_TYPES.pdf,
    MIME_TYPES.doc,
    MIME_TYPES.docx,
    MIME_TYPES.xls,
    MIME_TYPES.xlsx,
    MIME_TYPES.ppt,
    MIME_TYPES.pptx,
    MIME_TYPES.txt,
    MIME_TYPES.xml,
    MIME_TYPES.odt,
    MIME_TYPES.ods,
    MIME_TYPES.mp3,
    MIME_TYPES.wav,
    MIME_TYPES.wma,
    MIME_TYPES.acc,
  ].includes(file.type);

  if (!isAccess) {
    notification.error({
      message: 'Lỗi tải file',
      description: 'Định dạng file không được hỗ trợ. Vui lòng chọn file khác.',
    });
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    notification.error({
      message: 'Lỗi kích thước file',
      description: 'File phải nhỏ hơn 10MB. Vui lòng chọn file khác.',
    });
  }

  return !!isLt10M && isAccess;
};

export const beforeUploadAttachedFilesTask = (file: RcFile) => {
  const isAccess = [MIME_TYPES.pdf].includes(file.type);
  if (!isAccess) {
    notification.error({
      message: 'Lỗi định dạng file',
      description: 'Chỉ cho phép tải lên file PDF.',
    });
  }
  const isLtM = file.size / 1024 / 1024 < 10;
  if (!isLtM) {
    notification.error({
      message: 'Lỗi kích thước file',
      description: 'File phải nhỏ hơn 10MB.',
    });
  }
  return isLtM && isAccess;
};

export const beforeUploadDocumentFileStrict = (file: RcFile) => {
  const isAccess = [MIME_TYPES.pdf].includes(file.type);
  if (!isAccess) {
    notification.error({
      message: 'Lỗi định dạng file',
      description: 'Chỉ cho phép tải lên file PDF.',
    });
  }
  const isLtM = file.size / 1024 / 1024 < 10;
  if (!isLtM) {
    notification.error({
      message: 'Lỗi kích thước file',
      description: 'File phải nhỏ hơn 10MB.',
    });
  }
  return isLtM && isAccess ? true : Upload.LIST_IGNORE;
};

export const beforeUploadFile = (
  file: RcFile,
  mimeTypes: string[],
  maxFileSize: number,
) => {
  const isAccess = mimeTypes.includes(file.type);
  if (!isAccess)
    notification.error({
      message: 'Lỗi định dạng file',
      description: 'Định dạng file không được hỗ trợ.',
    });

  const isLtM = file.size / 1024 / 1024 < maxFileSize;
  if (!isLtM)
    notification.error({
      message: 'Lỗi kích thước file',
      description: `File phải nhỏ hơn ${maxFileSize}MB.`,
    });

  return isLtM && isAccess;
};

// UploadCare integration functions
export const uploadFileToUploadCare = async (
  file: File,
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  try {
    const fileId = await uploadToUploadCare(file);
    notification.success({
      message: 'Tải file thành công',
      description: `File "${file.name}" đã được tải lên thành công.`,
    });
    return { success: true, fileId };
  } catch (error) {
    notification.error({
      message: 'Lỗi tải file',
      description: 'Có lỗi xảy ra khi tải file. Vui lòng thử lại.',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get UploadCare file URL
export const getUploadCareFileUrl = (
  fileId: string,
  transformations?: string,
): string => {
  const baseUrl = `https://ucarecdn.com/${fileId}/`;
  return transformations ? `${baseUrl}-/${transformations}/` : baseUrl;
};

// Delete file from UploadCare
export const deleteUploadCareFile = async (
  fileId: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.uploadcare.com/files/${fileId}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Uploadcare.Simple ${UPLOADCARE_PUBLIC_KEY}:${process.env.VITE_UPLOADCARE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.ok) {
      notification.success({
        message: 'Xóa file thành công',
        description: 'File đã được xóa khỏi hệ thống.',
      });
      return true;
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    notification.error({
      message: 'Lỗi xóa file',
      description: 'Không thể xóa file. Vui lòng thử lại.',
    });
    return false;
  }
};

// Custom upload handler for Ant Design Upload component with UploadCare
export const customUploadRequest = async ({
  file,
  onSuccess,
  onError,
  onProgress,
}: any) => {
  try {
    onProgress({ percent: 10 });

    const result = await uploadFileToUploadCare(file as File);

    onProgress({ percent: 100 });

    if (result.success && result.fileId) {
      onSuccess({
        fileId: result.fileId,
        url: getUploadCareFileUrl(result.fileId),
        name: file.name,
      });
    } else {
      onError(new Error(result.error || 'Upload failed'));
    }
  } catch (error) {
    onError(error);
  }
};

/**
 * 🔧 ImageHelper - Utility object cho xử lý hình ảnh với UploadCare
 * Cung cấp các method tiện ích để tạo URL, fallback và transformation cho hình ảnh
 *
 * @description Tập hợp các function helper cho SmartImage component và các thành phần khác
 * @author React Team
 * @since 1.0.0
 */
export const ImageHelper = {
  /**
   * 🌐 Tạo URL hình ảnh với transformation parameters tùy chỉnh
   * Wrapper function cho getUploadCareFileUrl với khả năng custom transformation
   *
   * @param fileId - UUID của file trên UploadCare CDN
   * @param transformations - Chuỗi transformation parameters (optional)
   *   Ví dụ: '-/resize/300x200/-/crop/300x200/center/-/quality/85/'
   * @returns URL đầy đủ tới file với/không có transformation
   *
   * @example
   * ```typescript
   * // URL gốc không transformation
   * const originalUrl = ImageHelper.getImageUrl('uuid-here');
   *
   * // URL với custom transformation
   * const resizedUrl = ImageHelper.getImageUrl('uuid-here', '-/resize/400x300/-/quality/90/');
   * ```
   */
  getImageUrl: (fileId: string, transformations?: string): string => {
    return getUploadCareFileUrl(fileId, transformations);
  },

  /**
   * 🖼️ Trả về ảnh fallback placeholder dựa trên loại nội dung
   * Cung cấp các ảnh SVG được encode base64 làm data URI cho các loại nội dung khác nhau
   *
   * @param type - Loại ảnh fallback cần thiết:
   *   - 'avatar': Ảnh đại diện người dùng (40x40px hình tròn với icon user)
   *   - 'product': Ảnh sản phẩm (200x200px với icon hộp sản phẩm)
   *   - 'brand': Logo thương hiệu (100x100px với text "Brand")
   *   - 'general': Ảnh tổng quát (200x200px với icon hình ảnh)
   * @returns Chuỗi Data URI chứa ảnh SVG fallback
   *
   * @example
   * ```typescript
   * // Lấy fallback cho avatar
   * const avatarFallback = ImageHelper.getFallback('avatar');
   *
   * // Lấy fallback mặc định (general)
   * const defaultFallback = ImageHelper.getFallback();
   * ```
   */
  getFallback: (
    type: 'avatar' | 'product' | 'brand' | 'general' = 'general',
  ): string => {
    const fallbacks = {
      // Avatar fallback - 40x40px hình tròn với icon silhouette người dùng
      avatar:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmNWY1ZjUiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDEwQzEyLjc2MTQgMTAgMTUgNy43NjE0MiAxNSA1QzE1IDIuMjM4NTggMTIuNzYxNCAwIDEwIDBDNy4yMzg1OCAwIDUgMi4yMzg1OCA1IDVDNSA3Ljc2MTQyIDcuMjM4NTggMTAgMTAgMTBaTTEwIDEyLjVDNi42ODc1IDEyLjUgMCAxNC4xNTYyIDAgMTcuNVYyMEgyMFYxNy41QzIwIDE0LjE1NjIgMTMuMzEyNSAxMi41IDEwIDEyLjVaIiBmaWxsPSIjYzljOWM5Ci8+Cjwvc3ZnPgo8L3N2Zz4K',

      // Product fallback - 200x200px hình chữ nhật với icon hộp sản phẩm
      product:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ci8+Cjxzdmcgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgNjAgNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zMCAzMEM0MS4wNDU3IDMwIDUwIDIxLjA0NTcgNTAgMTBDNTAgOC45NTQzIDQ5LjA0NTcgOCA0OCA4SDEyQzEwLjk1NDMgOCAxMCA4Ljk1NDMgMTAgMTBDMTAgMjEuMDQ1NyAxOC45NTQzIDMwIDMwIDMwWiIgZmlsbD0iI2M5YzljOSIvPgo8L3N2Zz4KPC9zdmc+',

      // Brand fallback - 100x100px với nhãn text "Brand"
      brand:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjVmNWY1Ci8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYzljOWM5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CcmFuZDwvdGV4dD4KPC9zdmc+',

      // General fallback - 200x200px với icon hình ảnh/ảnh chung
      general:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ii8+CjxzdmcgeD0iNzAiIHk9IjcwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUwIDEwSDE0QzExLjc5IDEwIDEwIDExLjc5IDEwIDE0VjQ2QzEwIDQ4LjIxIDExLjc5IDUwIDE0IDUwSDUwQzUyLjIxIDUwIDU0IDQ4LjIxIDU0IDQ2VjE0QzU0IDExLjc5IDUyLjIxIDEwIDUwIDEwWk01MCA0Nkg0NkwzNiAzMEwyNiA0Nkg0NkwzNiAzMEwyNiA0Nkw0NiAzNkwzNiA0Nkg0NkwzNiAzMFoiIGZpbGw9IiNjOWM5YzkiLz4KPC9zdmc+Cjwvc3ZnPg==',
    };
    return fallbacks[type];
  },

  /**
   * 👤 Tạo URL avatar với kích thước tùy chỉnh
   * Áp dụng transformation để resize và crop thành hình vuông, tối ưu chất lượng
   *
   * @param fileId - UUID của file trên UploadCare
   * @param size - Kích thước (width x height) của avatar, mặc định 40px
   * @returns URL đầy đủ với transformation parameters
   *
   * @example
   * ```typescript
   * // Avatar 40x40px (mặc định)
   * const smallAvatar = ImageHelper.getAvatar('uuid-here');
   *
   * // Avatar 80x80px cho độ phân giải cao
   * const largeAvatar = ImageHelper.getAvatar('uuid-here', 80);
   * ```
   */
  getAvatar: (fileId: string, size: number = 40): string => {
    const transformations = `-/resize/${size}x${size}/-/crop/${size}x${size}/center/-/quality/85/-/format/auto/`;
    return getUploadCareFileUrl(fileId, transformations);
  },

  /**
   * 🖼️ Tạo URL thumbnail với chiều rộng tùy chỉnh
   * Tự động điều chỉnh chiều cao theo tỷ lệ, tối ưu chất lượng và format
   *
   * @param fileId - UUID của file trên UploadCare
   * @param width - Chiều rộng mong muốn, mặc định 300px
   * @returns URL với transformation giữ tỷ lệ khung hình gốc
   *
   * @example
   * ```typescript
   * // Thumbnail 300px width (mặc định)
   * const standardThumb = ImageHelper.getThumbnail('uuid-here');
   *
   * // Thumbnail 500px width cho preview lớn hơn
   * const largeThumb = ImageHelper.getThumbnail('uuid-here', 500);
   * ```
   */
  getThumbnail: (fileId: string, width: number = 300): string => {
    const transformations = `-/resize/${width}x/-/quality/85/-/format/auto/`;
    return getUploadCareFileUrl(fileId, transformations);
  },

  /**
   * 🛍️ Tạo URL hình ảnh sản phẩm với kích thước chuẩn
   * Cung cấp 3 sizes được định nghĩa sẵn phù hợp với layout ecommerce
   *
   * @param fileId - UUID của file trên UploadCare
   * @param size - Kích thước sản phẩm:
   *   - 'small': 150px (grid nhỏ, related products)
   *   - 'medium': 300px (grid chính, danh sách sản phẩm) - mặc định
   *   - 'large': 600px (detail page, zoom preview)
   * @returns URL được optimize cho hiển thị sản phẩm
   *
   * @example
   * ```typescript
   * // Medium size (300px) - phổ biến nhất
   * const productImg = ImageHelper.getProductImage('uuid-here');
   *
   * // Large size cho trang chi tiết
   * const detailImg = ImageHelper.getProductImage('uuid-here', 'large');
   *
   * // Small size cho related products
   * const relatedImg = ImageHelper.getProductImage('uuid-here', 'small');
   * ```
   */
  getProductImage: (
    fileId: string,
    size: 'small' | 'medium' | 'large' = 'medium',
  ): string => {
    const sizes = {
      small: 150,
      medium: 300,
      large: 600,
    };
    const width = sizes[size];
    const transformations = `-/resize/${width}x/-/quality/85/-/format/auto/`;
    return getUploadCareFileUrl(fileId, transformations);
  },
};
