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

export const coffeeWarehouseOperationalModuleManifest = {
  identity: { solutionKey: 'coffee', moduleKey: 'warehouse', contractVersion: '1.0.0' },
  workspaceType: 'warehouse',
  initialRouteKey: 'balances',
  routes: [
    route('balances', 'coffee.warehouse.balances', 'coffee.warehouse.balances.read'),
    route('receipt', 'coffee.warehouse.receipt', 'coffee.warehouse.receipt.create'),
    route(
      'write-off',
      'coffee.warehouse.writeOff',
      'coffee.warehouse.write-off.create',
    ),
    route('transfer', 'coffee.warehouse.transfer', 'coffee.warehouse.transfer.create'),
    route(
      'inventory',
      'coffee.warehouse.inventory',
      'coffee.warehouse.inventory.manage',
    ),
    route('history', 'coffee.warehouse.history', 'coffee.warehouse.history.read'),
  ],
  navigation: [
    nav('balances', 'coffee.warehouse.balances', 10, 'coffee.warehouse.balances.read'),
    nav('receipt', 'coffee.warehouse.receipt', 20, 'coffee.warehouse.receipt.create'),
    nav(
      'write-off',
      'coffee.warehouse.writeOff',
      30,
      'coffee.warehouse.write-off.create',
    ),
    nav(
      'transfer',
      'coffee.warehouse.transfer',
      40,
      'coffee.warehouse.transfer.create',
    ),
    nav(
      'inventory',
      'coffee.warehouse.inventory',
      50,
      'coffee.warehouse.inventory.manage',
    ),
    nav('history', 'coffee.warehouse.history', 60, 'coffee.warehouse.history.read'),
  ],
  declaredCapabilities: [
    'coffee.warehouse.balances.read',
    'coffee.warehouse.receipt.create',
    'coffee.warehouse.write-off.create',
    'coffee.warehouse.transfer.create',
    'coffee.warehouse.inventory.manage',
    'coffee.warehouse.history.read',
  ],
  requiredPlatformServices: [
    'employee-session',
    'authorization',
    'audit',
    'notifications',
  ],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '1.0.0',
} as const satisfies OperationalModuleManifest;
