import { describe, it, expect } from 'vitest';
import { ValueObject } from '../../../src/shared/domain/ValueObject';

class Coordenada extends ValueObject<{ x: number; y: number }> {
  static create(x: number, y: number): Coordenada {
    return new Coordenada({ x, y });
  }

  get x(): number {
    return this.props.x;
  }

  get y(): number {
    return this.props.y;
  }
}

describe('ValueObject', () => {
  it('deve criar value object com props congeladas', () => {
    const coord = Coordenada.create(10, 20);
    expect(coord.x).toBe(10);
    expect(coord.y).toBe(20);
    expect(() => {
      (coord as any).props.x = 99;
    }).toThrow();
  });

  it('equals deve retornar true para valores iguais', () => {
    const a = Coordenada.create(5, 5);
    const b = Coordenada.create(5, 5);
    expect(a.equals(b)).toBe(true);
  });

  it('equals deve retornar false para valores diferentes', () => {
    const a = Coordenada.create(1, 2);
    const b = Coordenada.create(3, 4);
    expect(a.equals(b)).toBe(false);
  });

  it('equals deve retornar false para null/undefined', () => {
    const a = Coordenada.create(1, 1);
    expect(a.equals(null as unknown as Coordenada)).toBe(false);
    expect(a.equals(undefined as unknown as Coordenada)).toBe(false);
  });
});
