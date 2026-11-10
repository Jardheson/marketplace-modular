import { Repository } from '../../../../shared/domain/Repository';
import { Product } from '../entities/Product';
import { Paginated, PaginationParams } from '../../../../shared/application/Pagination';

export interface ProductFilters {
  categoryId?: string;
  active?: boolean;
  search?: string;
}

export interface IProductRepository extends Repository<Product> {
  findBySku(sku: string): Promise<Product | null>;
  findPaginated(params: PaginationParams, filters?: ProductFilters): Promise<Paginated<Product>>;
  findByIds(ids: string[]): Promise<Product[]>;
}
