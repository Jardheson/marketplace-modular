import { UseCase } from '../../../../shared/application/UseCase';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ListProductsInput, ProductOutput } from '../dto/ProductDto';
import { Paginated, paginate } from '../../../../shared/application/Pagination';
import { ICache } from '../../../../infra/cache/RedisCache';

export class ListProductsUseCase implements UseCase<ListProductsInput, Paginated<ProductOutput>> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly cache: ICache,
  ) {}

  async execute(input: ListProductsInput): Promise<Paginated<ProductOutput>> {
    const cacheKey = `products:list:${JSON.stringify(input)}`;
    const cached = await this.cache.get<Paginated<ProductOutput>>(cacheKey);
    if (cached) return cached;

    const result = await this.productRepo.findPaginated(
      { page: input.page, pageSize: input.pageSize },
      {
        categoryId: input.categoryId,
        active: input.active,
        search: input.search,
      },
    );

    const output = paginate(
      result.data.map((p) => this.toOutput(p)),
      result.total,
      result.page,
      result.pageSize,
    );

    await this.cache.set(cacheKey, output);
    return output;
  }

  private toOutput(p: Product): ProductOutput {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price.toBRL(),
      currency: p.price.currency,
      stock: p.stock,
      categoryId: p.categoryId,
      sku: p.sku,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
