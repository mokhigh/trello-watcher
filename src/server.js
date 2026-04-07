import 'dotenv/config';
import app from './app.js';
import { logger } from './utils/logger.js';
import { redisClient } from './queue/index.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info('trello-watcher started', { port: PORT });
});

// --------------------------------------------------------------------------
// Graceful shutdown
// --------------------------------------------------------------------------

async function shutdown(signal) {
  logger.info('Shutdown signal received', { signal });

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis', { error: err.message });
    }

    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
