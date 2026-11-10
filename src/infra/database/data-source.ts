import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from '../../config/env';
import { ProductEntity } from '../../modules/catalog/infra/persistence/typeorm/entities/Product.entity';
import { CategoryEntity } from '../../modules/catalog/infra/persistence/typeorm/entities/Category.entity';
import { OrderEntity } from '../../modules/orders/infra/persistence/typeorm/entities/Order.entity';
import { OrderItemEntity } from '../../modules/orders/infra/persistence/typeorm/entities/OrderItem.entity';
import { PaymentEntity } from '../../modules/payments/infra/persistence/typeorm/entities/Payment.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  entities: [ProductEntity, CategoryEntity, OrderEntity, OrderItemEntity, PaymentEntity],
  synchronize: env.nodeEnv !== 'production',
  logging: env.db.logging,
  migrations: ['dist/infra/database/migrations/*.js'],
  migrationsRun: env.nodeEnv === 'production',
};

export const AppDataSource = new DataSource(dataSourceOptions);

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
