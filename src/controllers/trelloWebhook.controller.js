import { v4 as uuidv4 } from 'uuid';
import { parseEvent, SUPPORTED_ACTIONS, isListPlacement } from '../services/eventParser.js';
import { resolveProject } from '../services/projectRouter.js';
import { isDuplicate } from '../services/dedupe.service.js';
import { enqueueEvent } from '../services/queue.service.js';
import { logger } from '../utils/logger.js';

/**
 * HEAD /webhooks/trello
 *
 * Trello sends a HEAD request when a webhook is first registered to verify
 * the endpoint is reachable. We must respond 200 or registration will fail.
 */
export function headWebhook(_req, res) {
  res.sendStatus(200);
}

/**
 * POST /webhooks/trello
 *
 * Main webhook handler. Validates, parses, routes, deduplicates, and enqueues.
 */
export async function handleWebhook(req, res) {
  const requestId = req.headers['x-request-id'] || uuidv4();

  // 1. Parse & validate ---------------------------------------------------------
  const parsed = parseEvent(req.body);

  if (!parsed.ok) {
    if (parsed.unsupported) {
      return res.status(200).json({ status: 'ignored', reason: 'unsupported_action' });
    }
    return res.status(200).json({ status: 'ignored', reason: 'unprocessable_payload' });
  }

  const { event } = parsed;

  // 2. Filter unsupported action types ------------------------------------------
  if (!SUPPORTED_ACTIONS.has(event.actionType)) {
    return res.status(200).json({ status: 'ignored', reason: 'unsupported_action' });
  }

  // 3. Filter non-placement events ----------------------------------------------
  if (!isListPlacement(event)) {
    return res.status(200).json({ status: 'ignored', reason: 'not_a_list_placement' });
  }

  // 4. Route to project ---------------------------------------------------------
  const projectConfig = resolveProject(event);

  if (!projectConfig) {
    return res.status(200).json({ status: 'ignored', reason: 'list_not_configured' });
  }

  const { projectId, finishedListId } = projectConfig;

  // 5. Deduplicate --------------------------------------------------------------
  const duplicate = await isDuplicate(event.actionId);

  if (duplicate) {
    return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
  }

  // 6. Enqueue ------------------------------------------------------------------
  await enqueueEvent(event, projectId, requestId, finishedListId);

  logger.info('Event accepted', {
    requestId,
    actionId: event.actionId,
    projectId,
    cardId: event.cardId,
  });

  return res.status(202).json({ status: 'accepted', requestId });
}
