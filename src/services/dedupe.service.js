import { redisClient } from '../queue/index.js';
import { logger } from '../utils/logger.js';

// TTL for processed action IDs — long enough to cover Trello's retry window
const TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Returns true if this actionId has already been processed (duplicate).
 * Marks it as processed atomically using SET NX so concurrent requests are safe.
 */
export async function isDuplicate(actionId) {
  const key = `dedupe:trello:${actionId}`;

  // SET key 1 NX EX ttl — returns "OK" on first write, null if already exists
  const result = await redisClient.set(key, '1', 'EX', TTL_SECONDS, 'NX');

  if (result === null) {
    logger.warn('Duplicate action ignored', { actionId });
    return true;
  }

  return false;
}
