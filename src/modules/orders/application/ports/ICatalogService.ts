import { Money } from '../../../../shared/domain/Money';

export interface ProductInfo {
  id: string;
  name: string;
  price: Money;
  stock: number;
  active: boolean;
}

export interface ICatalogService {
  getProductInfo(productId: string): Promise<ProductInfo | null>;
  reserveStock(productId: string, quantity: number): Promise<void>;
}
