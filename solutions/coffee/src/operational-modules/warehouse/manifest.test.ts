import { describe, expect, it } from 'vitest';
import { coffeeWarehouseOperationalModuleManifest } from './manifest';

describe('Coffee Warehouse OperationalModuleManifest', () => {
  it('declares the six working sections without an intermediate hub', () => {
    expect(coffeeWarehouseOperationalModuleManifest.workspaceType).toBe('warehouse');
    expect(coffeeWarehouseOperationalModuleManifest.initialRouteKey).toBe('balances');
    expect(
      coffeeWarehouseOperationalModuleManifest.navigation.map((item) => item.routeKey),
    ).toEqual(['balances', 'receipt', 'write-off', 'transfer', 'inventory', 'history']);
    expect(coffeeWarehouseOperationalModuleManifest.routes).toHaveLength(6);
  });
});
