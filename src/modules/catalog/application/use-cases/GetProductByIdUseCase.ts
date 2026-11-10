import { UseCase } from '../../../../shared/application/UseCase';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { AppError } from '../../../../shared/domain/AppError';
import { ProductOutput } from '../dto/ProductDto';
import { ICache } from '../../../../infra/cache/RedisCache';

export class GetProductByIdUseCase implements UseCase<string, ProductOutput> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly cache: ICache,
  ) {}

  async execute(id: string): Promise<ProductOutput> {
    const cacheKey = `products:${id}`;
    const cached = await this.cache.get<ProductOutput>(cacheKey);
    if (cached) return cached;

    const product = await this.productRepo.findById(id);
    if (!product) throw AppError.notFound('Produto');

    const output = this.toOutput(product);
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
