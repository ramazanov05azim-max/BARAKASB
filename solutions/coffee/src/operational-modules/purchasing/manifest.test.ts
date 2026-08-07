import { describe, expect, it } from 'vitest';
import { coffeePurchaserOperationalModuleManifest } from './manifest';

describe('Coffee Purchaser OperationalModuleManifest', () => {
  it('declares five owned routes and capabilities', () => {
    expect(coffeePurchaserOperationalModuleManifest.workspaceType).toBe('purchasing');
    expect(coffeePurchaserOperationalModuleManifest.initialRouteKey).toBe('needs');
    expect(
      coffeePurchaserOperationalModuleManifest.navigation.map((item) => item.routeKey),
    ).toEqual(['needs', 'orders', 'deliveries', 'suppliers', 'history']);
    expect(coffeePurchaserOperationalModuleManifest.routes).toHaveLength(5);
  });
});
