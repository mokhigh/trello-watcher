import { listToProject } from '../config/projectMapping.js';

/**
 * Resolves a parsed event's triggerListId to a projectId.
 *
 * @param {import('./eventParser.js').ParsedEvent} event
 * @returns {string | null} projectId, or null if the list is not configured
 */
export function resolveProject(event) {
  const projectId = listToProject[event.triggerListId] ?? null;

  return projectId;
}
