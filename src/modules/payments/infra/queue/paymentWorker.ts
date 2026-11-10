import { queueManager, JobPayload } from '../../../../infra/queue/QueueManager';
import { PaymentOutput, ProcessPaymentInput } from '../../application/dto/PaymentDto';

const QUEUE_NAME = 'payments';

let registered = false;

export function registerPaymentWorker(
  processPayment: (input: ProcessPaymentInput) => Promise<PaymentOutput>,
): void {
  if (registered) return;
  registered = true;

  queueManager.registerWorker<ProcessPaymentInput, PaymentOutput>(
    QUEUE_NAME,
    async (job: { id?: string; data: JobPayload<ProcessPaymentInput> }) => {
      return processPayment(job.data.data);
    },
  );
}

export { QUEUE_NAME };
