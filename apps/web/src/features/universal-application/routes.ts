export const universalApplicationRoutes = {
  root: '/app',
  connect: '/app/connect',
  unavailable: '/app/unavailable',
} as const;

export const universalApplicationRouteValues = Object.values(
  universalApplicationRoutes,
);
