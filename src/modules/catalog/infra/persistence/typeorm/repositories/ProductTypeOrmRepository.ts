import { Repository, DataSource, ILike } from 'typeorm';
import {
  IProductRepository,
  ProductFilters,
} from '../../../../domain/repositories/IProductRepository';
import { Product } from '../../../../domain/entities/Product';
import { ProductEntity } from '../entities/Product.entity';
import { ProductMapper } from '../mappers/ProductMapper';
import { Paginated, PaginationParams } from '../../../../../../shared/application/Pagination';

export class ProductTypeOrmRepository implements IProductRepository {
  private repo: Repository<ProductEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ProductEntity);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Product[]> {
    const entities = await this.repo.find();
    return entities.map(ProductMapper.toDomain);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { sku } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.findByIds(ids);
    return entities.map(ProductMapper.toDomain);
  }

  async findPaginated(
    params: PaginationParams,
    filters?: ProductFilters,
  ): Promise<Paginated<Product>> {
    const where: Record<string, unknown> = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.active !== undefined) where.active = filters.active;
    if (filters?.search) where.name = ILike(`%${filters.search}%`);

    const [entities, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });

    return {
      data: entities.map(ProductMapper.toDomain),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async save(product: Product): Promise<Product> {
    const entity = ProductMapper.toEntity(product);
    await this.repo.save(entity);
    return product;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
