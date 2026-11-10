export abstract class Entity<Props> {
  protected readonly _id: string;
  protected props: Props;

  constructor(props: Props, id?: string) {
    this.props = props;
    this._id = id ?? crypto.randomUUID();
  }

  get id(): string {
    return this._id;
  }

  public equals(other: Entity<Props>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
