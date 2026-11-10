import { Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../shared/infrastructure/logger';

const connection = new IORedis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export interface JobPayload<T = unknown> {
  idempotencyKey: string;
  data: T;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  getQueue<T = unknown>(name: string): Queue<JobPayload<T>> {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue<JobPayload<T>>(name, { connection });
      this.queues.set(name, queue);
      logger.info({ queue: name }, 'queue.created');
    }
    return queue;
  }

  async enqueue<T, R>(
    queueName: string,
    payload: JobPayload<T>,
    opts?: { delay?: number; attempts?: number },
  ): Promise<R> {
    const queue = this.getQueue(queueName);
    const events = await this.getQueueEvents(queueName);
    const job = await queue.add(queueName, payload, {
      jobId: payload.idempotencyKey,
      attempts: opts?.attempts ?? 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
      removeOnFail: 50,
      ...(opts?.delay ? { delay: opts.delay } : {}),
    });
    logger.info({ queue: queueName, jobId: payload.idempotencyKey }, 'queue.enqueued');
    return (await job.waitUntilFinished(events, 60_000)) as R;
  }

  registerWorker<T, R = void>(
    queueName: string,
    handler: (job: { id?: string; data: JobPayload<T> }) => Promise<R>,
  ): Worker {
    const worker = new Worker<JobPayload<T>, R>(
      queueName,
      handler as unknown as (job: { id?: string; data: JobPayload<T> }) => Promise<R>,
      { connection },
    );
    worker.on('completed', (job) =>
      logger.info({ queue: queueName, jobId: job.id }, 'job.completed'),
    );
    worker.on('failed', (job, err) =>
      logger.error({ queue: queueName, jobId: job?.id, error: err.message }, 'job.failed'),
    );
    this.workers.set(queueName, worker);
    return worker;
  }

  async closeAll(): Promise<void> {
    for (const [, worker] of this.workers) await worker.close();
    for (const [, queue] of this.queues) await queue.close();
    for (const [, events] of this.queueEvents) await events.close();
    this.queueEvents.clear();
    await connection.quit();
  }

  private async getQueueEvents(queueName: string): Promise<QueueEvents> {
    let events = this.queueEvents.get(queueName);
    if (!events) {
      events = new QueueEvents(queueName, { connection: connection.duplicate() });
      this.queueEvents.set(queueName, events);
    }
    await events.waitUntilReady();
    return events;
  }
}

export const queueManager = new QueueManager();
