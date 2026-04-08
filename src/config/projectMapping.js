/**
 * Maps Trello board IDs → projects, and list IDs → project identifiers.
 *
 * Replace the placeholder IDs with your real Trello board/list IDs.
 * You can add as many boards and projects as needed.
 * Multiple projects can share the same triggerListId for fan-out.
 */
export const boardConfigs = [
  {
    boardId: "69d3eb9607ef389d2f57d1d9",
    projects: [
      {
        projectId: "mokhigh-portfolio",
        triggerListId: "69d3ebc07495a8ef9836ba18",
        finishedListId: "69d4012bd270e66eb921aec5",
      },
      {
        projectId: "kb-business-hub",
        triggerListId: "69d43a6bb68ce277cfdddedf",
        finishedListId: "69d4012bd270e66eb921aec5",
      },
    ],
  },
];

/**
 * Flat lookup: triggerListId → Array<{ projectId, finishedListId }>
 * Built once at startup for O(1) routing.
 * Supports multiple targets per triggerListId (fan-out).
 */
export const listToProjects = new Map();

for (const { projects } of boardConfigs) {
  for (const { triggerListId, projectId, finishedListId } of projects) {
    if (!listToProjects.has(triggerListId)) {
      listToProjects.set(triggerListId, []);
    }
    listToProjects.get(triggerListId).push({ projectId, finishedListId });
  }
}

// Backward-compat: single-target lookup (returns first match)
export const listToProject = Object.fromEntries(
  [...listToProjects.entries()].map(([k, v]) => [k, v[0]])
);
