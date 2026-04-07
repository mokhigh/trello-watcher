import { z } from 'zod';

// --------------------------------------------------------------------------
// Zod schemas
// --------------------------------------------------------------------------

const TrelloMemberSchema = z.object({
  id: z.string(),
  fullName: z.string().optional(),
  username: z.string().optional(),
});

const TrelloListSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const TrelloCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string().default(''),
  shortUrl: z.string().optional(),
  idList: z.string().optional(),
});

const TrelloActionDataSchema = z.object({
  card: TrelloCardSchema,
  listAfter: TrelloListSchema.optional(),
  listBefore: TrelloListSchema.optional(),
  list: TrelloListSchema.optional(),   // present on createCard
});

const TrelloActionSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: TrelloActionDataSchema,
  memberCreator: TrelloMemberSchema.optional(),
  date: z.string().optional(),
});

export const TrelloWebhookSchema = z.object({
  action: TrelloActionSchema,
  model: z.object({ id: z.string() }).passthrough().optional(),
});

// --------------------------------------------------------------------------
// Parsed event shape
// --------------------------------------------------------------------------

/**
 * @typedef {Object} ParsedEvent
 * @property {string} actionId
 * @property {string} actionType
 * @property {string} cardId
 * @property {string} cardName
 * @property {string} description
 * @property {string} cardUrl
 * @property {string|null} listBefore
 * @property {string|null} listAfter
 * @property {string} triggerListId  - the list ID that should be matched against config
 * @property {string} createdAt
 */

const MAX_DESC_LENGTH = 500;

/**
 * Validates and extracts a normalised event from a raw Trello webhook payload.
 *
 * @param {unknown} raw
 * @returns {{ ok: true, event: ParsedEvent } | { ok: false, error: string }}
 */
export function parseEvent(raw) {
  // Pre-filter: skip full validation for action types we don't handle.
  // Non-card Trello events (board/list/member updates) won't have action.data.card,
  // so we bail early rather than letting the schema report a validation error.
  const actionType = raw?.action?.type;
  if (actionType && !SUPPORTED_ACTIONS.has(actionType)) {
    return { ok: false, unsupported: true, actionType };
  }

  const result = TrelloWebhookSchema.safeParse(raw);

  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  const { action } = result.data;
  const { card, listAfter, listBefore, list } = action.data;

  // For createCard the destination list is in `list`; for updateCard it's in `listAfter`
  const destinationList = listAfter ?? list ?? null;

  return {
    ok: true,
    event: {
      actionId: action.id,
      actionType: action.type,
      cardId: card.id,
      cardName: card.name,
      description: card.desc.length > MAX_DESC_LENGTH
        ? card.desc.slice(0, MAX_DESC_LENGTH) + '\n…'
        : card.desc,
      cardUrl: card.shortUrl ?? '',
      listBefore: listBefore?.id ?? null,
      listAfter: destinationList?.id ?? null,
      listName: destinationList?.name ?? null,
      triggerListId: destinationList?.id ?? card.idList ?? null,
      createdAt: action.date ?? new Date().toISOString(),
    },
  };
}

// --------------------------------------------------------------------------
// Action type helpers
// --------------------------------------------------------------------------

export const SUPPORTED_ACTIONS = new Set(['createCard', 'updateCard']);

/**
 * Returns true when the event represents a card arriving in a (new) list.
 * - createCard  → always a new placement
 * - updateCard  → only when listBefore differs from listAfter (a move)
 */
export function isListPlacement(event) {
  if (event.actionType === 'createCard') return true;

  if (event.actionType === 'updateCard') {
    return (
      event.listAfter !== null &&
      event.listBefore !== null &&
      event.listAfter !== event.listBefore
    );
  }

  return false;
}
