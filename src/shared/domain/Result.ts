export type Result<T, E = AppErrorLike> = { ok: true; value: T } | { ok: false; error: E };

export interface AppErrorLike {
  message: string;
  code?: string;
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail<E extends AppErrorLike>(error: E): Result<never, E> {
  return { ok: false, error };
}
