import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { AppError } from '../../../../shared/domain/AppError';

export interface CategoryProps {
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Category extends AggregateRoot<CategoryProps> {
  private constructor(props: CategoryProps, id?: string) {
    super(props, id);
  }

  static create(input: { name: string; description?: string }): Category {
    if (!input.name?.trim()) throw AppError.validation('Nome da categoria é obrigatório.');
    const now = new Date();
    return new Category({
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: CategoryProps, id: string): Category {
    return new Category(props, id);
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
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
}
