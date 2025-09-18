import { NestFactory } from '@nestjs/core'; // Nhập NestFactory để tạo ứng dụng NestJS
import { AppModule } from './app.module'; // Nhập AppModule, module chính của ứng dụng
import {
  DocumentBuilder,
  SwaggerModule,
  SwaggerCustomOptions,
} from '@nestjs/swagger'; // Nhập các module từ @nestjs/swagger để cấu hình tài liệu API Swagger
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'; // Nhập FastifyAdapter và NestFastifyApplication để sử dụng Fastify thay vì Express
import multipart from '@fastify/multipart'; // Nhập plugin multipart để xử lý yêu cầu multipart/form-data (tải file)
import fastifyBasicAuth from '@fastify/basic-auth'; // Nhập plugin fastify-basic-auth để xác thực cơ bản
import { UnauthorizedException, ValidationPipe } from '@nestjs/common'; // Nhập UnauthorizedException và ValidationPipe từ NestJS
import fastifyHelmet from '@fastify/helmet'; // Nhập fastify-helmet để tăng cường bảo mật HTTP headers
import * as fs from 'fs';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  // Hàm bootstrap để khởi động ứng dụng
  const app = await NestFactory.create<NestFastifyApplication>( // Tạo ứng dụng NestJS với Fastify
    AppModule, // Sử dụng AppModule làm module gốc
    new FastifyAdapter(), // Sử dụng Fastify thay vì Express làm adapter
    {
      // Cấu hình logger cho ứng dụng
      logger:
        process.env.NODE_ENV !== 'production' // Kiểm tra môi trường không phải production
          ? ['error', 'warn', 'verbose', 'log', 'debug'] // Ghi log chi tiết trong môi trường phát triển
          : ['error', 'warn'], // Chỉ ghi log lỗi và cảnh báo trong môi trường production
    },
  );

  const fastify = app.getHttpAdapter().getInstance(); // Lấy instance của Fastify từ adapter
  // Đặt timeout đủ dài cho các yêu cầu tải lên file lớn (300 giây)
  fastify.server.setTimeout(300 * 1000); // Đặt thời gian chờ của server là 300 giây (5 phút)

  // Đăng ký plugin multipart với giới hạn tăng lên
  try {
    await app.register(multipart, {
      // Đăng ký plugin multipart để xử lý tải file
      limits: {
        // Cấu hình giới hạn cho multipart
        fileSize: 50 * 1024 * 1024, // Giới hạn kích thước file tối đa 50MB
        files: 10, // Giới hạn số lượng file tối đa là 10
        fieldNameSize: 100, // Giới hạn độ dài tên trường là 100 byte
        fieldSize: 1000000, // Giới hạn kích thước trường là 1MB
        fields: 10, // Giới hạn số lượng trường là 10
        headerPairs: 2000, // Giới hạn số cặp header là 2000
      },
      attachFieldsToBody: false, // Gắn các trường vào body
    });
    await app.register(fastifyCookie); // Đăng ký plugin fastify-cookie để xử lý cookie

    // Sanitize multipart body BEFORE Nest validation pipes run to prevent recursion and ensure DTO fields are readable
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.addHook('preValidation', (request, _reply, done) => {
      try {
        const req = request as {
          isMultipart?: () => boolean;
          body?: Record<string, unknown>;
        };
        const isMultipart =
          typeof req.isMultipart === 'function' ? req.isMultipart() : false;
        if (isMultipart && req.body && typeof req.body === 'object') {
          // Lọc các trường không phải chuỗi hoặc không thuộc DTO
          Object.keys(req.body).forEach((key) => {
            const value = req.body[key];
            if (
              key === 'logo' &&
              (typeof value !== 'string' || Buffer.isBuffer(value))
            ) {
              Reflect.deleteProperty(req.body, key); // Loại bỏ logo nếu là đối tượng tệp
            } else if (
              typeof value !== 'string' &&
              typeof value !== 'number' &&
              typeof value !== 'boolean' &&
              value !== null
            ) {
              Reflect.deleteProperty(req.body, key); // Loại bỏ các giá trị phức tạp
            }
          });
          // Chuyển sang đối tượng phẳng để tránh tham chiếu vòng
          req.body = { ...req.body };
        }
      } catch {
        // ignore
      }
      done();
    });

    // console.log('✅ Plugin multipart đã được đăng ký thành công'); // Thông báo thành công khi đăng ký plugin
  } catch (error) {
    console.error('❌ Không thể đăng ký plugin multipart:', error); // Thông báo lỗi nếu đăng ký thất bại
    throw error; // Ném lỗi để dừng ứng dụng
  }

  // Kích hoạt CORS với cấu hình chi tiết để debug
  app.enableCors({
    // Kích hoạt CORS cho ứng dụng
    origin: true, // Cho phép tất cả nguồn gốc (dùng danh sách cụ thể trong production)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Các phương thức HTTP được phép
    credentials: true, // Cho phép gửi credentials (cookies, auth headers)
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization', // Các header được phép
    exposedHeaders: 'Content-Length,Content-Range', // Các header trả về cho client
    preflightContinue: false, // Không tiếp tục xử lý yêu cầu preflight
    optionsSuccessStatus: 204, // Trạng thái trả về cho yêu cầu OPTIONS
    maxAge: 86400, // Thời gian lưu cache CORS là 24 giờ
  });

  console.log('✅ CORS đã được cấu hình với cài đặt cho phép để thử nghiệm'); // Thông báo CORS đã được cấu hình

  await app.register(fastifyHelmet, {
    // Đăng ký fastify-helmet để thêm các header bảo mật
    contentSecurityPolicy: {
      // Cấu hình Content Security Policy
      directives: {
        // Các chỉ thị CSP
        defaultSrc: [`'self'`], // Chỉ cho phép nội dung từ chính server
        styleSrc: [`'self'`, `'unsafe-inline'`], // Cho phép style từ server và inline
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'], // Cho phép hình ảnh từ server, data URI, và validator.swagger.io
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`], // Cho phép script từ server và inline HTTPS
      },
      reportOnly: true, // Chỉ báo cáo vi phạm CSP, không chặn
    },
  });

  const customOptions: SwaggerCustomOptions = {
    // Cấu hình tùy chỉnh cho Swagger
    swaggerOptions: {
      // Tùy chọn giao diện Swagger
      persistAuthorization: true, // Giữ trạng thái xác thực khi tải lại trang
      displayRequestDuration: true, // Hiển thị thời gian xử lý yêu cầu
    },
    customSiteTitle: 'Nest-test API Docs', // Tiêu đề tùy chỉnh cho tài liệu Swagger
  };

  if (process.env.NODE_ENV === 'production') {
    // Nếu đang ở môi trường production
    const authenticate = { realm: 'Nest-test API Documentation' }; // Cấu hình realm cho xác thực cơ bản
    const validate = (username: string, password: string) => {
      // Hàm xác thực username và password
      if (
        username !== process.env.USER_SWAGGER || // Kiểm tra username với biến môi trường
        password !== process.env.PASSWORD_SWAGGER // Kiểm tra password với biến môi trường
      ) {
        throw new UnauthorizedException( // Ném lỗi nếu xác thực thất bại
          'Tên người dùng hoặc mật khẩu không hợp lệ cho tài liệu Swagger',
        );
      }
    };

    await fastify.register(fastifyBasicAuth, { validate, authenticate }); // Đăng ký plugin xác thực cơ bản
    fastify.after(() => {
      // Sau khi đăng ký, thêm hook để kiểm tra xác thực
      fastify.addHook('onRequest', (request, reply, done) => {
        // Hook kiểm tra yêu cầu
        if (
          request.url === `/${process.env.PREFIX_SWAGGER}` || // Kiểm tra nếu URL là Swagger
          request.url.startsWith(`/${process.env.PREFIX_SWAGGER}/`) || // Hoặc bắt đầu bằng prefix Swagger
          request.url === `/${process.env.PREFIX_SWAGGER}-json` // Hoặc là tài liệu JSON của Swagger
        ) {
          fastify.basicAuth(request, reply, done); // Áp dụng xác thực cơ bản
        } else {
          done(); // Bỏ qua xác thực cho các route khác
        }
      });
    });
  }
  const swaggerDocument = new DocumentBuilder() // Tạo cấu hình tài liệu Swagger
    .setTitle('Nest-test API') // Đặt tiêu đề API
    .setDescription('Tài liệu API cho ứng dụng Nest-test') // Đặt mô tả API
    .setVersion('1.0') // Đặt phiên bản API
    .addBearerAuth() // Thêm xác thực Bearer
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocument); // Tạo tài liệu Swagger từ cấu hình
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  SwaggerModule.setup('api', app, document, customOptions); // Thiết lập Swagger tại endpoint /api

  app.useGlobalPipes(
    // Áp dụng ValidationPipe cho toàn bộ ứng dụng
    new ValidationPipe({
      // Tạo ValidationPipe với các tùy chọn
      transform: true, // Tự động chuyển đổi dữ liệu sang kiểu của DTO
      transformOptions: { enableImplicitConversion: true }, // Cho phép chuyển đổi ngầm
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(3000, '0.0.0.0'); // Khởi động ứng dụng trên cổng 3000, lắng nghe tất cả giao diện
}

void bootstrap(); // Gọi hàm bootstrap để khởi động ứng dụng
