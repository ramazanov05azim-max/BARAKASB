import type { OperationalModuleManifest } from '@barakasb/contracts-platform';
import { describe, expect, it } from 'vitest';
import {
  DuplicateOperationalModuleRegistrationError,
  InMemoryOperationalModuleRuntimeRegistry,
  InvalidOperationalModuleManifestError,
} from './operational-module-registry';

const manifest: OperationalModuleManifest = {
  identity: {
    solutionKey: 'test-solution',
    moduleKey: 'test-module',
    contractVersion: '1.0.0',
  },
  workspaceType: 'test-module',
  initialRouteKey: 'home',
  routes: [
    {
      routeKey: 'home',
      screenKey: 'home',
      titleKey: 'test.home',
      requiredCapabilities: ['test.read'],
    },
  ],
  navigation: [
    {
      itemKey: 'home',
      labelKey: 'test.home',
      routeKey: 'home',
      order: 10,
      requiredCapabilities: ['test.read'],
    },
  ],
  declaredCapabilities: ['test.read'],
  requiredPlatformServices: ['employee-session', 'authorization'],
  stateSchemaVersion: 1,
  serviceContractVersion: '1.0.0',
  repositoryContractVersion: '1.0.0',
};

describe('InMemoryOperationalModuleRuntimeRegistry', () => {
  it('registers one module runtime by workspace type', () => {
    const registry = new InMemoryOperationalModuleRuntimeRegistry<string, string>();
    const runtime = { manifest, render: (context: string) => context };

    registry.register(runtime);

    expect(registry.has('test-module')).toBe(true);
    expect(registry.get('test-module')).toBe(runtime);
    expect(registry.get('test-module')?.render('ready')).toBe('ready');
  });

  it('rejects two UI owners for one workspace type', () => {
    const registry = new InMemoryOperationalModuleRuntimeRegistry<string, string>();
    registry.register({ manifest, render: (context) => context });

    expect(() => registry.register({ manifest, render: (context) => context })).toThrow(
      DuplicateOperationalModuleRegistrationError,
    );
  });

  it('rejects navigation that targets a screen outside the module', () => {
    const registry = new InMemoryOperationalModuleRuntimeRegistry<string, string>();
    const invalidManifest: OperationalModuleManifest = {
      ...manifest,
      navigation: [{ ...manifest.navigation[0]!, routeKey: 'foreign-route' }],
    };

    expect(() =>
      registry.register({ manifest: invalidManifest, render: (context) => context }),
    ).toThrow(InvalidOperationalModuleManifestError);
  });
});
