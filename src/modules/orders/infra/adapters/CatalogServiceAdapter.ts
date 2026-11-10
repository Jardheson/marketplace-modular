import { ICatalogService, ProductInfo } from '../../application/ports/ICatalogService';
import { IProductRepository } from '../../../catalog/domain/repositories/IProductRepository';
import { AppError } from '../../../../shared/domain/AppError';

export class CatalogServiceAdapter implements ICatalogService {
  constructor(private readonly productRepo: IProductRepository) {}

  async getProductInfo(productId: string): Promise<ProductInfo | null> {
    const product = await this.productRepo.findById(productId);
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      active: product.active,
    };
  }

  async reserveStock(productId: string, quantity: number): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw AppError.notFound(`Produto ${productId}`);
    product.reserveStock(quantity);
    await this.productRepo.save(product);
  }
}
