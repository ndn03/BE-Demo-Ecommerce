import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({ path: '.env' });

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV === 'development',
  retryAttempts: 3,
  timezone: 'Z',
  logging: false,
  entities: ['dist/entities/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
};

export const dataSource = new DataSource(typeOrmConfig as DataSourceOptions);
globalThis.dataSource = dataSource;
