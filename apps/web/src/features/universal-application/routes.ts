export const universalApplicationRoutes = {
  root: '/app',
  connect: '/app/connect',
  runtime: '/app/runtime',
  unavailable: '/app/unavailable',
} as const;

export const universalApplicationRouteValues = Object.values(
  universalApplicationRoutes,
);
