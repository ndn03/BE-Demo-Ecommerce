import { Repository } from 'typeorm';
interface BaseServiceOptions {
  /**
   * Nếu `silent = true`, method sẽ trả về void (mặc định).
   * Nếu `silent = false`, method sẽ trả về boolean (true nếu thao tác thành công).
   */
  silent?: boolean;
}

export class BaseService<Entity> {
  constructor(protected readonly repository: Repository<Entity>) {}

  /**
   * @param ids ID hoặc mảng ID cần soft delete
   * @param options Có thể truyền `{ silent: false }` để lấy kết quả
   */
  async softDelete(
    ids: number | number[],
    options: BaseServiceOptions = {},
  ): Promise<boolean | void> {
    const result = await this.repository.softDelete(ids);
    if (options.silent === false) {
      return !!result.affected;
    }
  }

  /**
   * @param ids ID hoặc mảng ID cần restore
   * @param options Có thể truyền `{ silent: false }` để lấy kết quả
   */
  async restore(
    ids: number | number[],
    options: BaseServiceOptions = {},
  ): Promise<boolean | void> {
    const result = await this.repository.restore(ids);
    if (options.silent === false) {
      return !!result.affected;
    }
  }

  /**
   * @param ids ID hoặc mảng ID cần xóa
   * @param options Có thể truyền `{ silent: false }` để lấy kết quả
   */
  async delete(
    ids: number | number[],
    options: BaseServiceOptions = {},
  ): Promise<boolean | void> {
    const result = await this.repository.delete(ids);
    if (options.silent === false) {
      return !!result.affected;
    }
  }
}
