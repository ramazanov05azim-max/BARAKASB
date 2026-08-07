import type { OperationalModuleManifest } from '@barakasb/contracts-platform';

const route = (routeKey: string, titleKey: string, capability: string) => ({
  routeKey,
  screenKey: routeKey,
  titleKey,
  requiredCapabilities: [capability],
});

const navigation = (itemKey: string, labelKey: string, order: number) => ({
  itemKey,
  labelKey,
  routeKey: itemKey,
  order,
  requiredCapabilities: [`coffee.kitchen.${itemKey}.read`],
});

export const coffeeKitchenOperationalModuleManifest = {
  identity: {
    solutionKey: 'coffee',
    moduleKey: 'kitchen',
    contractVersion: '1.0.0',
  },
  workspaceType: 'kitchen',
  initialRouteKey: 'new',
  routes: [
    route('new', 'coffee.kitchen.new', 'coffee.kitchen.new.read'),
    route('preparing', 'coffee.kitchen.preparing', 'coffee.kitchen.preparing.read'),
    route('ready', 'coffee.kitchen.ready', 'coffee.kitchen.ready.read'),
    route('history', 'coffee.kitchen.history', 'coffee.kitchen.history.read'),
  ],
  navigation: [
    navigation('new', 'coffee.kitchen.new', 10),
    navigation('preparing', 'coffee.kitchen.preparing', 20),
    navigation('ready', 'coffee.kitchen.ready', 30),
    navigation('history', 'coffee.kitchen.history', 40),
  ],
  declaredCapabilities: [
    'coffee.kitchen.new.read',
    'coffee.kitchen.preparing.read',
    'coffee.kitchen.ready.read',
    'coffee.kitchen.history.read',
    'coffee.kitchen.prepare',
  ],
  requiredPlatformServices: ['employee-session', 'authorization', 'audit'],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '0.0.0',
} as const satisfies OperationalModuleManifest;
