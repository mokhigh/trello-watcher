/**
 * Maps Trello board IDs → projects, and list IDs → project identifiers.
 *
 * Replace the placeholder IDs with your real Trello board/list IDs.
 * You can add as many boards and projects as needed.
 */
export const boardConfigs = [
  {
    boardId: "69d3eb9607ef389d2f57d1d9",
    projects: [
      {
        projectId: "mokhigh-portfolio",
        triggerListId: "69d3ebc07495a8ef9836ba18",
      },
    ],
  },
];

/**
 * Flat lookup: triggerListId → projectId
 * Built once at startup for O(1) routing.
 */
export const listToProject = Object.fromEntries(
  boardConfigs.flatMap(({ projects }) =>
    projects.map(({ triggerListId, projectId }) => [triggerListId, projectId])
  )
);
