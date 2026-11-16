import { describe, it, expect } from 'vitest';
import { Entity } from '../../../src/shared/domain/Entity';

class TestEntity extends Entity<{ nome: string }> {
  get nome(): string {
    return this.props.nome;
  }
}

describe('Entity', () => {
  it('deve criar entidade com id gerado automaticamente', () => {
    const entity = new TestEntity({ nome: 'teste' });
    expect(entity.id).toBeDefined();
    expect(typeof entity.id).toBe('string');
    expect(entity.nome).toBe('teste');
  });

  it('deve criar entidade com id fornecido', () => {
    const id = 'id-custom-123';
    const entity = new TestEntity({ nome: 'teste' }, id);
    expect(entity.id).toBe(id);
  });

  it('equals deve retornar true para mesma instância', () => {
    const entity = new TestEntity({ nome: 'teste' });
    expect(entity.equals(entity)).toBe(true);
  });

  it('equals deve retornar true para mesmo id', () => {
    const id = 'mesmo-id';
    const a = new TestEntity({ nome: 'a' }, id);
    const b = new TestEntity({ nome: 'b' }, id);
    expect(a.equals(b)).toBe(true);
  });

  it('equals deve retornar false para ids diferentes', () => {
    const a = new TestEntity({ nome: 'a' });
    const b = new TestEntity({ nome: 'b' });
    expect(a.equals(b)).toBe(false);
  });

  it('equals deve retornar false para null/undefined', () => {
    const entity = new TestEntity({ nome: 'teste' });
    expect(entity.equals(null as unknown as TestEntity)).toBe(false);
    expect(entity.equals(undefined as unknown as TestEntity)).toBe(false);
  });
});
