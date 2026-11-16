import { describe, it, expect, vi } from 'vitest';
import { CreateCategoryUseCase } from '../../../src/modules/catalog/application/use-cases/CreateCategoryUseCase';
import { AppError } from '../../../src/shared/domain/AppError';

describe('CreateCategoryUseCase', () => {
  it('deve criar categoria com dados válidos', async () => {
    const categoryRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((c) => c),
      delete: vi.fn(),
    };

    const useCase = new CreateCategoryUseCase(categoryRepo);
    const result = await useCase.execute({
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
    });

    expect(result.name).toBe('Nova Categoria');
    expect(result.description).toBe('Descrição da categoria');
    expect(result.active).toBe(true);
    expect(categoryRepo.save).toHaveBeenCalled();
  });

  it('deve lançar erro de validação quando nome é vazio', async () => {
    const categoryRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new CreateCategoryUseCase(categoryRepo);

    await expect(useCase.execute({ name: '', description: '' })).rejects.toThrow(AppError);
    expect(categoryRepo.save).not.toHaveBeenCalled();
  });

  it('deve lançar erro de validação quando nome é só espaços', async () => {
    const categoryRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new CreateCategoryUseCase(categoryRepo);

    await expect(useCase.execute({ name: '   ', description: '' })).rejects.toThrow(AppError);
    expect(categoryRepo.save).not.toHaveBeenCalled();
  });

  it('deve usar descrição vazia como padrão quando não informada', async () => {
    const categoryRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((c) => c),
      delete: vi.fn(),
    };

    const useCase = new CreateCategoryUseCase(categoryRepo);
    const result = await useCase.execute({ name: 'Categoria', description: '' });

    expect(result.description).toBe('');
  });
});
