import { Entity } from './Entity';

export type DomainEventHandler<T> = (event: T) => void;

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: unknown[] = [];

  protected addDomainEvent(event: unknown): void {
    this._domainEvents.push(event);
  }

  public pullDomainEvents(): unknown[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }

  get domainEvents(): unknown[] {
    return [...this._domainEvents];
  }
}
