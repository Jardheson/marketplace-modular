import { Repository, DataSource } from 'typeorm';
import { ICategoryRepository } from '../../../../domain/repositories/ICategoryRepository';
import { Category } from '../../../../domain/entities/Category';
import { CategoryEntity } from '../entities/Category.entity';

export class CategoryTypeOrmRepository implements ICategoryRepository {
  private repo: Repository<CategoryEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(CategoryEntity);
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    return Category.restore(
      {
        name: entity.name,
        description: entity.description,
        active: entity.active,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      entity.id,
    );
  }

  async findAll(): Promise<Category[]> {
    const entities = await this.repo.find();
    return entities.map((e) =>
      Category.restore(
        {
          name: e.name,
          description: e.description,
          active: e.active,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        },
        e.id,
      ),
    );
  }

  async save(category: Category): Promise<Category> {
    const entity = new CategoryEntity();
    entity.id = category.id;
    entity.name = category.name;
    entity.description = category.description;
    entity.active = category.active;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;
    await this.repo.save(entity);
    return category;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
