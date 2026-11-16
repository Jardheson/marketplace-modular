import { describe, it, expect } from 'vitest';
import { featureFlags, isFeatureEnabled } from '../../../src/shared/infrastructure/feature-flags';

describe('Feature Flags', () => {
  it('deve exportar objeto featureFlags com newCheckout', () => {
    expect(featureFlags).toHaveProperty('newCheckout');
    expect(typeof featureFlags.newCheckout).toBe('boolean');
  });

  it('isFeatureEnabled deve retornar booleano para flag existente', () => {
    const result = isFeatureEnabled('newCheckout');
    expect(typeof result).toBe('boolean');
  });
});
