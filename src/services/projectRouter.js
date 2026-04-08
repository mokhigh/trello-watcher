import { listToProjects } from '../config/projectMapping.js';

/**
 * Resolves a parsed event's triggerListId to all matching project configs.
 * Returns an array for fan-out (multiple projects per list).
 *
 * @param {import('./eventParser.js').ParsedEvent} event
 * @returns {Array<{ projectId: string, finishedListId: string }>}
 */
export function resolveProjects(event) {
  return listToProjects.get(event.triggerListId) ?? [];
}

/**
 * @deprecated Use resolveProjects for fan-out support.
 */
export function resolveProject(event) {
  const results = resolveProjects(event);
  return results[0] ?? null;
}
