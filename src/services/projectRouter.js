import { listToProject } from '../config/projectMapping.js';

/**
 * Resolves a parsed event's triggerListId to its project config.
 *
 * @param {import('./eventParser.js').ParsedEvent} event
 * @returns {{ projectId: string, finishedListId: string } | null}
 */
export function resolveProject(event) {
  return listToProject[event.triggerListId] ?? null;
}
