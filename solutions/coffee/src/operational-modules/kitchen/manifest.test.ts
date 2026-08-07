import { describe, expect, it } from 'vitest';
import { coffeeKitchenOperationalModuleManifest } from './manifest';

describe('Coffee Kitchen manifest', () => {
  it('declares the four KDS views through OperationalModuleManifest', () => {
    expect(coffeeKitchenOperationalModuleManifest.identity).toEqual({
      solutionKey: 'coffee',
      moduleKey: 'kitchen',
      contractVersion: '1.0.0',
    });
    expect(
      coffeeKitchenOperationalModuleManifest.navigation.map((item) => item.routeKey),
    ).toEqual(['new', 'preparing', 'ready', 'history']);
    expect(coffeeKitchenOperationalModuleManifest.repositoryContractVersion).toBe(
      '0.0.0',
    );
  });
});
