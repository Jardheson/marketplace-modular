import { describe, it, expect, vi } from 'vitest';
import {
  registerPaymentWorker,
  QUEUE_NAME,
} from '../../../src/modules/payments/infra/queue/paymentWorker';

// Mock do QueueManager
vi.mock('../../../src/infra/queue/QueueManager', () => ({
  queueManager: {
    registerWorker: vi.fn().mockImplementation((_name, _handler) => ({
      on: vi.fn(),
    })),
  },
  JobPayload: {} as unknown,
}));

describe('paymentWorker', () => {
  it('deve exportar QUEUE_NAME como payments', () => {
    expect(QUEUE_NAME).toBe('payments');
  });

  it('registerPaymentWorker deve ser uma função', () => {
    expect(typeof registerPaymentWorker).toBe('function');
  });

  it('não deve lançar erro ao chamar registerPaymentWorker', () => {
    const mockProcess = vi.fn().mockResolvedValue({ id: 'pay-1' });
    expect(() => {
      registerPaymentWorker(mockProcess);
    }).not.toThrow();
  });
});
