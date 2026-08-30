import Redis from 'ioredis';
import { getRedisUrl } from './config';

const LOCK_KEY = 'startup:reconciliation-lock';
const LOCK_TTL_SECONDS = 60;

export async function withStartupLock<T>(fn: () => Promise<T>) {
  const redis = new Redis(getRedisUrl());

  try {
    const acquired = await redis.set(LOCK_KEY, '1', 'NX', 'EX', LOCK_TTL_SECONDS);
    if (!acquired) {
      console.log('Startup reconciliation skipped: lock already held');
      return null;
    }

    return await fn();
  } finally {
    await redis.quit();
  }
}
