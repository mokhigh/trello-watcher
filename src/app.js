import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { headWebhook, handleWebhook } from './controllers/trelloWebhook.controller.js';
import { verifyTrelloSignature } from './middleware/verifyTrelloSignature.js';
import { logger } from './utils/logger.js';

const app = express();

// --------------------------------------------------------------------------
// Middleware
// --------------------------------------------------------------------------

// Capture raw body for HMAC verification before JSON parsing consumes the stream
app.use(
  express.json({
    limit: '512kb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Attach a request ID to every request for tracing
app.use((req, _res, next) => {
  req.headers['x-request-id'] ??= uuidv4();
  next();
});

// --------------------------------------------------------------------------
// Routes
// --------------------------------------------------------------------------

// Trello webhook registration sends a HEAD first — must return 200
app.head('/webhooks/trello', headWebhook);
app.post('/webhooks/trello', verifyTrelloSignature, handleWebhook);

// Health check — useful for load balancers and K8s probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// --------------------------------------------------------------------------
// Error handling
// --------------------------------------------------------------------------

// Catch async errors forwarded via next(err)
app.use((err, req, res, _next) => {
  const requestId = req.headers['x-request-id'];
  logger.error('Unhandled error', { requestId, error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', requestId });
});

export default app;
