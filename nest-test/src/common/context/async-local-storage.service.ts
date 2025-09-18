import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

// Interface định nghĩa cấu trúc dữ liệu context cho mỗi request
export interface RequestContext {
  requestId?: string; // ID duy nhất của request (optional)
  userId?: string; // ID của user thực hiện request (optional)
  editorId?: string; // ID của editor nếu có (optional)
  [key: string]: string | undefined; // Cho phép thêm các property động khác
}

// Decorator đánh dấu class có thể được inject vào các component khác
@Injectable()
export class AsyncLocalStorageService {
  // Instance của AsyncLocalStorage với type RequestContext
  // private readonly: chỉ truy cập trong class và không thể thay đổi
  private readonly als = new AsyncLocalStorage<RequestContext>();

  /**
   * Khởi tạo context và chạy callback trong context đó
   * Tất cả async operations trong callback sẽ có access đến context này
   * @param context - Dữ liệu context để lưu trữ
   * @param callback - Function sẽ được thực thi trong context
   * @returns Kết quả của callback function
   */
  run<R>(context: RequestContext, callback: (...args: any[]) => R): R {
    return this.als.run(context, callback);
  }

  /**
   * Lấy giá trị của một key từ context hiện tại
   * @param key - Key cần lấy giá trị (phải thuộc RequestContext)
   * @returns Giá trị của key hoặc undefined nếu không tìm thấy
   */
  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    const store: RequestContext | undefined = this.als.getStore();
    return store ? store[key] : undefined;
  }

  /**
   * Cập nhật giá trị trong context hiện tại
   * @param key - Key cần cập nhật
   * @param value - Giá trị mới
   */
  set<T extends keyof RequestContext>(key: T, value: RequestContext[T]): void {
    const store = this.als.getStore();
    if (store) {
      store[key] = value;
    }
    // Hiển thị warning nếu store chưa được khởi tạo
    if (!store) {
      console.warn(`[AsyncLocalStorage] Store not initialized for key: ${key}`);
    }
  }

  /**
   * Trả về toàn bộ context object hiện tại
   * @returns RequestContext object hoặc undefined nếu không trong context nào
   */
  getStore(): RequestContext | undefined {
    return this.als.getStore();
  }
}
