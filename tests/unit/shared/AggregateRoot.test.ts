import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '../../../src/shared/domain/AggregateRoot';

class TestAggregate extends AggregateRoot<{ nome: string }> {
  static create(nome: string): TestAggregate {
    return new TestAggregate({ nome });
  }

  adicionarEvento(evento: unknown): void {
    this.addDomainEvent(evento);
  }
}

describe('AggregateRoot', () => {
  it('deve começar sem eventos de domínio', () => {
    const agg = TestAggregate.create('teste');
    expect(agg.domainEvents).toEqual([]);
  });

  it('deve adicionar eventos de domínio', () => {
    const agg = TestAggregate.create('teste');
    const evento = { type: 'CRIADO', data: 1 };
    agg.adicionarEvento(evento);

    expect(agg.domainEvents).toHaveLength(1);
    expect(agg.domainEvents[0]).toEqual(evento);
  });

  it('pullDomainEvents deve retornar e limpar eventos', () => {
    const agg = TestAggregate.create('teste');
    agg.adicionarEvento({ type: 'A' });
    agg.adicionarEvento({ type: 'B' });

    const events = agg.pullDomainEvents();
    expect(events).toHaveLength(2);
    expect(agg.domainEvents).toEqual([]);
  });

  it('domainEvents deve retornar cópia (imutabilidade)', () => {
    const agg = TestAggregate.create('teste');
    agg.adicionarEvento({ type: 'A' });

    const events = agg.domainEvents;
    events.push({ type: 'INJETADO' });

    expect(agg.domainEvents).toHaveLength(1);
  });
});
