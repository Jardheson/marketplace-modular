import { describe, it, expect } from 'vitest';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { AppError } from '../../../src/shared/domain/AppError';

describe('Category', () => {
  it('deve criar categoria com dados válidos', () => {
    const category = Category.create({
      name: 'Eletrônicos',
      description: 'Produtos tecnológicos',
    });

    expect(category.name).toBe('Eletrônicos');
    expect(category.description).toBe('Produtos tecnológicos');
    expect(category.active).toBe(true);
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });

  it('deve usar descrição vazia quando não informada', () => {
    const category = Category.create({ name: 'Categoria' });
    expect(category.description).toBe('');
  });

  it('deve fazer trim do nome e descrição', () => {
    const category = Category.create({
      name: '  Categoria  ',
      description: '  Descrição  ',
    });
    expect(category.name).toBe('Categoria');
    expect(category.description).toBe('Descrição');
  });

  it('deve lançar erro quando nome é vazio', () => {
    expect(() => Category.create({ name: '' })).toThrow(AppError);
  });

  it('deve lançar erro quando nome é só espaços', () => {
    expect(() => Category.create({ name: '   ' })).toThrow(AppError);
  });

  it('restore deve reconstruir categoria', () => {
    const props = {
      name: 'Restaurada',
      description: 'Descrição',
      active: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };
    const category = Category.restore(props, 'id-restaurado');

    expect(category.id).toBe('id-restaurado');
    expect(category.name).toBe('Restaurada');
    expect(category.active).toBe(false);
    expect(category.createdAt).toEqual(new Date('2024-01-01'));
  });
});
