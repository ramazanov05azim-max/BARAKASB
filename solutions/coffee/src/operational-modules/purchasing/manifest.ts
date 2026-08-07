import type { OperationalModuleManifest } from '@barakasb/contracts-platform';

const route = (routeKey: string, titleKey: string, capability: string) => ({
  routeKey,
  screenKey: routeKey,
  titleKey,
  requiredCapabilities: [capability],
});

const nav = (itemKey: string, labelKey: string, order: number, capability: string) => ({
  itemKey,
  labelKey,
  routeKey: itemKey,
  order,
  requiredCapabilities: [capability],
});

export const coffeePurchaserOperationalModuleManifest = {
  identity: {
    solutionKey: 'coffee',
    moduleKey: 'purchasing',
    contractVersion: '1.0.0',
  },
  workspaceType: 'purchasing',
  initialRouteKey: 'needs',
  routes: [
    route('needs', 'coffee.purchasing.needs', 'coffee.purchasing.needs.read'),
    route('orders', 'coffee.purchasing.orders', 'coffee.purchasing.orders.manage'),
    route(
      'deliveries',
      'coffee.purchasing.deliveries',
      'coffee.purchasing.deliveries.manage',
    ),
    route(
      'suppliers',
      'coffee.purchasing.suppliers',
      'coffee.purchasing.suppliers.manage',
    ),
    route('history', 'coffee.purchasing.history', 'coffee.purchasing.history.read'),
  ],
  navigation: [
    nav('needs', 'coffee.purchasing.needs', 10, 'coffee.purchasing.needs.read'),
    nav('orders', 'coffee.purchasing.orders', 20, 'coffee.purchasing.orders.manage'),
    nav(
      'deliveries',
      'coffee.purchasing.deliveries',
      30,
      'coffee.purchasing.deliveries.manage',
    ),
    nav(
      'suppliers',
      'coffee.purchasing.suppliers',
      40,
      'coffee.purchasing.suppliers.manage',
    ),
    nav('history', 'coffee.purchasing.history', 50, 'coffee.purchasing.history.read'),
  ],
  declaredCapabilities: [
    'coffee.purchasing.needs.read',
    'coffee.purchasing.orders.manage',
    'coffee.purchasing.deliveries.manage',
    'coffee.purchasing.suppliers.manage',
    'coffee.purchasing.history.read',
  ],
  requiredPlatformServices: [
    'employee-session',
    'authorization',
    'audit',
    'notifications',
    'synchronization',
  ],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '1.0.0',
} as const satisfies OperationalModuleManifest;
