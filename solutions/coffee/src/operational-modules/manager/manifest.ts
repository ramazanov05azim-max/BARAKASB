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

export const coffeeManagerOperationalModuleManifest = {
  identity: {
    solutionKey: 'coffee',
    moduleKey: 'manager',
    contractVersion: '1.0.0',
  },
  workspaceType: 'manager',
  initialRouteKey: 'overview',
  routes: [
    route('overview', 'coffee.manager.overview', 'coffee.manager.overview.read'),
    route('purchasing', 'coffee.manager.purchasing', 'coffee.manager.purchasing.read'),
    route('warehouse', 'coffee.manager.warehouse', 'coffee.manager.warehouse.read'),
    route('events', 'coffee.manager.events', 'coffee.manager.events.read'),
    route('warnings', 'coffee.manager.warnings', 'coffee.manager.warnings.read'),
  ],
  navigation: [
    nav('overview', 'coffee.manager.overview', 10, 'coffee.manager.overview.read'),
    nav(
      'purchasing',
      'coffee.manager.purchasing',
      20,
      'coffee.manager.purchasing.read',
    ),
    nav('warehouse', 'coffee.manager.warehouse', 30, 'coffee.manager.warehouse.read'),
    nav('events', 'coffee.manager.events', 40, 'coffee.manager.events.read'),
    nav('warnings', 'coffee.manager.warnings', 50, 'coffee.manager.warnings.read'),
  ],
  declaredCapabilities: [
    'coffee.manager.overview.read',
    'coffee.manager.purchasing.read',
    'coffee.manager.warehouse.read',
    'coffee.manager.events.read',
    'coffee.manager.warnings.read',
  ],
  requiredPlatformServices: [
    'employee-session',
    'authorization',
    'audit',
    'synchronization',
  ],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '1.0.0',
} as const satisfies OperationalModuleManifest;
