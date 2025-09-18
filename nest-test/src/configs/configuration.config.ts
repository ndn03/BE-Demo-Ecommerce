import { registerAs } from '@nestjs/config';

export default registerAs('base', () => ({
  port: parseInt(process.env.PORT, 10) || 300,
  prefix: '/api',
}));
