export interface CreateProductInput {
  name: string;
  description: string;
  price: number; // BRL
  stock: number;
  categoryId: string;
  sku: string;
}

export interface UpdateProductPriceInput {
  productId: string;
  price: number; // BRL
}

export interface ProductOutput {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  categoryId: string;
  sku: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsInput {
  page: number;
  pageSize: number;
  categoryId?: string;
  active?: boolean;
  search?: string;
}
