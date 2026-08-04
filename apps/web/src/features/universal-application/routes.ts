export const universalApplicationRoutes = {
  root: '/app',
  connect: '/app/connect',
  workspace: '/app/workspace',
} as const;

export const universalApplicationRouteValues = Object.values(
  universalApplicationRoutes,
);
