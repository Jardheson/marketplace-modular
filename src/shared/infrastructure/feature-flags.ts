import { env } from '../../config/env';

/**
 * Feature Flags (M3): 1 feature flag obrigatória.
 * Implementação simples baseada em variável de ambiente.
 * Em produção, pode ser trocada por Unleash/GrowthBook.
 */
export const featureFlags = {
  newCheckout: env.featureFlags.newCheckout,
};

export type FeatureFlagName = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return featureFlags[flag] === true;
}
