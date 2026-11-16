import { UseCase } from '../../../../shared/application/UseCase';
import { Category } from '../../domain/entities/Category';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CreateCategoryInput, CategoryOutput } from '../dto/CategoryDto';

export class CreateCategoryUseCase implements UseCase<CreateCategoryInput, CategoryOutput> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CategoryOutput> {
    const category = Category.create({
      name: input.name,
      description: input.description,
    });

    const saved = await this.categoryRepo.save(category);

    return this.toOutput(saved);
  }

  private toOutput(c: Category): CategoryOutput {
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      active: c.active,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
