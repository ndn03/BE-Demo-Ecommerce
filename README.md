# Context Management (AsyncLocalStorage)

Thư mục này quản lý context cho mỗi request sử dụng AsyncLocalStorage.

## Thành phần

- `async-local-storage.service.ts`: Service cung cấp hàm run, get, set, lấy context hiện tại.
- `context.middleware.ts`: Middleware khởi tạo context cho mỗi request, sinh requestId, lấy userId/editorId nếu có.
- `context.module.ts`: Module toàn cục export service.
- `index.ts`: Export các thành phần context.

## Sử dụng

- Đăng ký `ContextModule` trong AppModule.
- Đăng ký `ContextMiddleware` trong main.ts hoặc module cần thiết.
- Inject `AsyncLocalStorageService` vào service/controller để lấy thông tin context (requestId, userId, editorId, ...).

## Lưu ý

- Không trùng lặp với logic auth, chỉ dùng để lưu context request.
- Có thể mở rộng thêm các trường khác trong `RequestContext` nếu cần.
