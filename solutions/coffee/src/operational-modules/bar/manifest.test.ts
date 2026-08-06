import { describe, expect, it } from 'vitest';
import { coffeeBarOperationalModuleManifest } from './manifest';

describe('Coffee Bar Operational Module manifest', () => {
  it('owns its navigation, screens and contract versions', () => {
    expect(coffeeBarOperationalModuleManifest.identity).toEqual({
      solutionKey: 'coffee',
      moduleKey: 'bar',
      contractVersion: '1.0.0',
    });
    expect(coffeeBarOperationalModuleManifest.initialRouteKey).toBe('hall');
    expect(
      coffeeBarOperationalModuleManifest.navigation.map(({ routeKey }) => routeKey),
    ).toEqual(['hall', 'menu', 'orders']);
    expect(coffeeBarOperationalModuleManifest.stateSchemaVersion).toBe(1);
  });
});
