import { describe, it, expect } from 'vitest';
import { ok, fail } from '../../../src/shared/domain/Result';

describe('Result', () => {
  it('ok deve criar resultado de sucesso', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('fail deve criar resultado de falha', () => {
    const result = fail({ message: 'erro', code: 'ERR' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('erro');
      expect(result.error.code).toBe('ERR');
    }
  });
});
