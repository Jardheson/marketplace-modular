import { describe, it, expect } from 'vitest';
import { paginate, Paginated } from '../../../src/shared/application/Pagination';

describe('Pagination', () => {
  it('deve calcular totalPages corretamente', () => {
    const result: Paginated<number> = paginate([1, 2, 3], 10, 1, 3);
    expect(result.totalPages).toBe(4);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
    expect(result.total).toBe(10);
  });

  it('deve retornar totalPages = 1 quando total menor que pageSize', () => {
    const result = paginate([1, 2], 2, 1, 10);
    expect(result.totalPages).toBe(1);
  });

  it('deve retornar totalPages = 1 quando total = 0 (garante pelo menos 1 página)', () => {
    const result = paginate([], 0, 1, 20);
    expect(result.totalPages).toBe(1);
  });
});
