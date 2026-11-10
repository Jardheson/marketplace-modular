import { Redis } from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../shared/infrastructure/logger';

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}

export class RedisCache implements ICache {
  private client: Redis;

  constructor(client?: Redis) {
    this.client =
      client ??
      new Redis({
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        lazyConnect: false,
        retryStrategy: (times) => Math.min(times * 200, 2000),
        connectTimeout: 2000,
      });

    this.client.on('error', (err) => {
      logger.warn({ error: err.message }, 'redis.connection.error');
    });
  }

  private withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('redis_timeout')), ms)),
    ]);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.withTimeout(this.client.get(key));
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.warn({ key, error: (error as Error).message }, 'cache.get.failed');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = env.cacheTtlSeconds): Promise<void> {
    try {
      await this.withTimeout(this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds));
    } catch (error) {
      logger.warn({ key, error: (error as Error).message }, 'cache.set.failed');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.withTimeout(this.client.del(key));
    } catch (error) {
      logger.warn({ key, error: (error as Error).message }, 'cache.del.failed');
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const keys: string[] = [];
      for await (const batch of stream) {
        keys.push(...batch);
      }
      if (keys.length) await this.withTimeout(this.client.del(keys));
    } catch (error) {
      logger.warn({ pattern, error: (error as Error).message }, 'cache.delByPattern.failed');
    }
  }

  getClient(): Redis {
    return this.client;
  }
}

export const cache = new RedisCache();
