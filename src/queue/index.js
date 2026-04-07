import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // required by BullMQ
};

export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));

export const trelloEventsQueue = new Queue('trello-events', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

/**
 * Dead-letter queue — jobs land here after exhausting all retry attempts.
 * A separate worker can consume from this queue for alerting or manual replay.
 */
export const deadLetterQueue = new Queue('trello-events-dlq', {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});
