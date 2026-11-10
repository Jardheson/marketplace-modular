import { UseCase } from '../../../../shared/application/UseCase';
import { Product } from '../../domain/entities/Product';
import { Money } from '../../../../shared/domain/Money';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { AppError } from '../../../../shared/domain/AppError';
import { CreateProductInput, ProductOutput } from '../dto/ProductDto';
import { ICache } from '../../../../infra/cache/RedisCache';

export class CreateProductUseCase implements UseCase<CreateProductInput, ProductOutput> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly cache: ICache,
  ) {}

  async execute(input: CreateProductInput): Promise<ProductOutput> {
    const existing = await this.productRepo.findBySku(input.sku);
    if (existing) throw AppError.conflict(`SKU ${input.sku} já cadastrado.`);

    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw AppError.notFound('Categoria');

    const product = Product.create({
      name: input.name,
      description: input.description,
      price: Money.fromBRL(input.price),
      stock: input.stock,
      categoryId: input.categoryId,
      sku: input.sku,
    });

    const saved = await this.productRepo.save(product);
    await this.cache.delByPattern('products:*');

    return this.toOutput(saved);
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
