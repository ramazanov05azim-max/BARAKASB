import { describe, expect, it } from 'vitest';
import { coffeeManagerOperationalModuleManifest } from './manifest';

describe('Coffee Manager OperationalModuleManifest', () => {
  it('declares five read-only owned routes', () => {
    expect(coffeeManagerOperationalModuleManifest.workspaceType).toBe('manager');
    expect(coffeeManagerOperationalModuleManifest.initialRouteKey).toBe('overview');
    expect(
      coffeeManagerOperationalModuleManifest.navigation.map((item) => item.routeKey),
    ).toEqual(['overview', 'purchasing', 'warehouse', 'events', 'warnings']);
    expect(
      coffeeManagerOperationalModuleManifest.declaredCapabilities.every((value) =>
        value.endsWith('.read'),
      ),
    ).toBe(true);
  });
});
