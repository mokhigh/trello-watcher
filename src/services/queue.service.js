import { trelloEventsQueue } from '../queue/index.js';
import { logger } from '../utils/logger.js';

/**
 * Pushes a normalised Trello event onto the BullMQ queue.
 *
 * @param {import('./eventParser.js').ParsedEvent} event
 * @param {string} projectId
 * @param {string} requestId  — for end-to-end tracing
 * @returns {Promise<import('bullmq').Job>}
 */
export async function enqueueEvent(event, projectId, requestId) {
  const job = {
    eventId: event.actionId,
    source: 'trello',
    projectId,
    cardId: event.cardId,
    title: event.cardName,
    description: event.description,
    url: event.cardUrl,
    createdAt: event.createdAt,
  };

  const bullJob = await trelloEventsQueue.add(
    `${event.actionType}:${event.cardId}`,
    job,
    {
      jobId: event.actionId, // idempotency at BullMQ level as well
    }
  );

  logger.info('Job enqueued', {
    requestId,
    jobId: bullJob.id,
    projectId,
    cardId: event.cardId,
    actionType: event.actionType,
  });

  return bullJob;
}
