import { Product } from '../../../../domain/entities/Product';
import { Money } from '../../../../../../shared/domain/Money';
import { ProductEntity } from '../entities/Product.entity';

export class ProductMapper {
  static toDomain(entity: ProductEntity): Product {
    return Product.restore(
      {
        name: entity.name,
        description: entity.description,
        price: Money.BRL(Number(entity.priceCents)),
        stock: entity.stock,
        categoryId: entity.categoryId,
        sku: entity.sku,
        active: entity.active,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      entity.id,
    );
  }

  static toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.priceCents = product.price.amount;
    entity.currency = product.price.currency;
    entity.stock = product.stock;
    entity.categoryId = product.categoryId;
    entity.sku = product.sku;
    entity.active = product.active;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;
    return entity;
  }
}
