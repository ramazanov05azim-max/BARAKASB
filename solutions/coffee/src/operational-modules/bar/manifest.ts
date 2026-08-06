import type { OperationalModuleManifest } from '@barakasb/contracts-platform';

export const coffeeBarOperationalModuleManifest = {
  identity: {
    solutionKey: 'coffee',
    moduleKey: 'bar',
    contractVersion: '1.0.0',
  },
  workspaceType: 'bar',
  initialRouteKey: 'hall',
  routes: [
    {
      routeKey: 'hall',
      screenKey: 'hall',
      titleKey: 'coffee.bar.hall',
      requiredCapabilities: ['coffee.bar.hall.read'],
    },
    {
      routeKey: 'menu',
      screenKey: 'menu',
      titleKey: 'coffee.bar.menu',
      requiredCapabilities: ['coffee.bar.menu.read'],
    },
    {
      routeKey: 'orders',
      screenKey: 'orders',
      titleKey: 'coffee.bar.orders',
      requiredCapabilities: ['coffee.bar.orders.read'],
    },
  ],
  navigation: [
    {
      itemKey: 'hall',
      labelKey: 'coffee.bar.hall',
      routeKey: 'hall',
      order: 10,
      requiredCapabilities: ['coffee.bar.hall.read'],
    },
    {
      itemKey: 'menu',
      labelKey: 'coffee.bar.menu',
      routeKey: 'menu',
      order: 20,
      requiredCapabilities: ['coffee.bar.menu.read'],
    },
    {
      itemKey: 'orders',
      labelKey: 'coffee.bar.orders',
      routeKey: 'orders',
      order: 30,
      requiredCapabilities: ['coffee.bar.orders.read'],
    },
  ],
  declaredCapabilities: [
    'coffee.bar.hall.read',
    'coffee.bar.menu.read',
    'coffee.bar.orders.read',
  ],
  requiredPlatformServices: ['employee-session', 'authorization', 'media'],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '1.0.0',
} as const satisfies OperationalModuleManifest;
