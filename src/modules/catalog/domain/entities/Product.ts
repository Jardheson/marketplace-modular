import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { Money } from '../../../../shared/domain/Money';
import { AppError } from '../../../../shared/domain/AppError';

export interface ProductProps {
  name: string;
  description: string;
  price: Money;
  stock: number;
  categoryId: string;
  sku: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  static create(input: {
    name: string;
    description: string;
    price: Money;
    stock: number;
    categoryId: string;
    sku: string;
  }): Product {
    if (!input.name?.trim()) throw AppError.validation('Nome do produto é obrigatório.');
    if (!input.sku?.trim()) throw AppError.validation('SKU é obrigatório.');
    if (input.stock < 0) throw AppError.validation('Estoque não pode ser negativo.');

    const now = new Date();
    return new Product({
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      price: input.price,
      stock: input.stock,
      categoryId: input.categoryId,
      sku: input.sku.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: ProductProps, id: string): Product {
    return new Product(props, id);
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get price(): Money {
    return this.props.price;
  }
  get stock(): number {
    return this.props.stock;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get sku(): string {
    return this.props.sku;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updatePrice(newPrice: Money): void {
    this.props.price = newPrice;
    this.props.updatedAt = new Date();
  }

  addStock(quantity: number): void {
    if (quantity <= 0) throw AppError.validation('Quantidade deve ser positiva.');
    this.props.stock += quantity;
    this.props.updatedAt = new Date();
  }

  reserveStock(quantity: number): void {
    if (quantity <= 0) throw AppError.validation('Quantidade deve ser positiva.');
    if (this.props.stock < quantity) {
      throw AppError.business('Estoque insuficiente.', {
        sku: this.props.sku,
        requested: quantity,
        available: this.props.stock,
      });
    }
    this.props.stock -= quantity;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }
}
