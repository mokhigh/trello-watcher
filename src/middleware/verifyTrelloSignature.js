import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Trello signs each webhook request with:
 *   base64( HMAC-SHA1( callbackURL + rawBody, secret ) )
 *
 * The signature is sent in the `x-trello-webhook` header.
 *
 * When TRELLO_WEBHOOK_SECRET is not set this middleware is a no-op,
 * allowing local development without a secret.
 */

const secret = process.env.TRELLO_WEBHOOK_SECRET;
const callbackUrl = process.env.TRELLO_CALLBACK_URL || '';

function computeSignature(rawBody) {
  return createHmac('sha1', secret)
    .update(rawBody + callbackUrl)
    .digest('base64');
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
function safeEqual(a, b) {
  const bA = Buffer.from(a);
  const bB = Buffer.from(b);
  if (bA.length !== bB.length) return false;
  return timingSafeEqual(bA, bB);
}

export function verifyTrelloSignature(req, res, next) {
  if (!secret) {
    return next();
  }

  const signature = req.headers['x-trello-webhook'];
  const requestId = req.headers['x-request-id'];

  if (!signature) {
    logger.warn('Missing Trello signature header', { requestId });
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expected = computeSignature(req.rawBody);

  if (!safeEqual(signature, expected)) {
    logger.warn('Invalid Trello signature', {
      requestId,
      received: signature,
      expected,
      callbackUrl,
      rawBodyLength: req.rawBody?.length,
      rawBodyPreview: req.rawBody?.slice(0, 100),
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}
