import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { ProductTypeOrmRepository } from '../../../src/modules/catalog/infra/persistence/typeorm/repositories/ProductTypeOrmRepository';
import { CategoryTypeOrmRepository } from '../../../src/modules/catalog/infra/persistence/typeorm/repositories/CategoryTypeOrmRepository';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { Money } from '../../../src/shared/domain/Money';
import { ProductEntity } from '../../../src/modules/catalog/infra/persistence/typeorm/entities/Product.entity';
import { CategoryEntity } from '../../../src/modules/catalog/infra/persistence/typeorm/entities/Category.entity';
import { InitialSchema1700000000000 } from '../../../src/infra/database/migrations/1700000000000-InitialSchema';

describe('ProductTypeOrmRepository (integração)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let productRepo: ProductTypeOrmRepository;
  let categoryRepo: CategoryTypeOrmRepository;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'test_db',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
      .start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test_db',
      entities: [ProductEntity, CategoryEntity],
      migrations: [InitialSchema1700000000000],
      migrationsRun: true,
      synchronize: false,
      logging: false,
    });

    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await dataSource.initialize();
        break;
      } catch (e) {
        if (attempt === 10) throw e;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    productRepo = new ProductTypeOrmRepository(dataSource);
    categoryRepo = new CategoryTypeOrmRepository(dataSource);
  }, 120000);

  afterAll(async () => {
    if (dataSource) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('deve salvar e recuperar um produto', async () => {
    const category = Category.create({ name: 'Eletrônicos' });
    await categoryRepo.save(category);

    const product = Product.create({
      name: 'Smartphone',
      description: '5G',
      price: Money.fromBRL(2999),
      stock: 50,
      categoryId: category.id,
      sku: 'SP-001',
    });
    await productRepo.save(product);

    const found = await productRepo.findBySku('SP-001');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Smartphone');
    expect(found!.price.toBRL()).toBe(2999);
  });

  it('deve retornar null para SKU inexistente', async () => {
    const found = await productRepo.findBySku('NAO-EXISTE');
    expect(found).toBeNull();
  });

  it('deve reverter a migração inicial ao remover o schema', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await new InitialSchema1700000000000().down(queryRunner);
      const [result] = await queryRunner.query(`SELECT to_regclass('products') AS table_name`);
      expect(result.table_name).toBeNull();
    } finally {
      await queryRunner.release();
    }
  });
});
