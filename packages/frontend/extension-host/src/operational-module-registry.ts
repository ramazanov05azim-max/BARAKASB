import type { OperationalModuleManifest } from '@barakasb/contracts-platform';

export interface OperationalModuleRuntime<TContext, TRendered> {
  readonly manifest: OperationalModuleManifest;
  render(context: TContext): TRendered;
}

export interface OperationalModuleRuntimeRegistry<TContext, TRendered> {
  register(runtime: OperationalModuleRuntime<TContext, TRendered>): void;
  get(workspaceType: string): OperationalModuleRuntime<TContext, TRendered> | undefined;
  has(workspaceType: string): boolean;
}

export class DuplicateOperationalModuleRegistrationError extends Error {
  constructor(workspaceType: string) {
    super(`An Operational Module is already registered for "${workspaceType}".`);
    this.name = 'DuplicateOperationalModuleRegistrationError';
  }
}

export class InvalidOperationalModuleManifestError extends Error {
  constructor(reason: string) {
    super(`Invalid Operational Module manifest: ${reason}.`);
    this.name = 'InvalidOperationalModuleManifestError';
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new InvalidOperationalModuleManifestError(`${label} must be unique`);
  }
}

function validateManifest(manifest: OperationalModuleManifest): void {
  const routeKeys = manifest.routes.map(({ routeKey }) => routeKey);
  const screenKeys = manifest.routes.map(({ screenKey }) => screenKey);
  const navigationKeys = manifest.navigation.map(({ itemKey }) => itemKey);
  const declaredCapabilities = new Set(manifest.declaredCapabilities);

  if (routeKeys.length === 0) {
    throw new InvalidOperationalModuleManifestError('at least one route is required');
  }
  assertUnique(routeKeys, 'route keys');
  assertUnique(screenKeys, 'screen keys');
  assertUnique(navigationKeys, 'navigation item keys');
  assertUnique(manifest.declaredCapabilities, 'declared capabilities');
  assertUnique(manifest.requiredPlatformServices, 'platform service keys');

  if (!routeKeys.includes(manifest.initialRouteKey)) {
    throw new InvalidOperationalModuleManifestError(
      'the initial route must be declared',
    );
  }

  for (const item of manifest.navigation) {
    if (!routeKeys.includes(item.routeKey)) {
      throw new InvalidOperationalModuleManifestError(
        `navigation item "${item.itemKey}" targets an unknown route`,
      );
    }
  }

  const requiredCapabilities = [
    ...manifest.routes.flatMap(({ requiredCapabilities: values }) => values),
    ...manifest.navigation.flatMap(({ requiredCapabilities: values }) => values),
  ];
  for (const capability of requiredCapabilities) {
    if (!declaredCapabilities.has(capability)) {
      throw new InvalidOperationalModuleManifestError(
        `capability "${capability}" is not declared`,
      );
    }
  }
}

export class InMemoryOperationalModuleRuntimeRegistry<
  TContext,
  TRendered,
> implements OperationalModuleRuntimeRegistry<TContext, TRendered> {
  readonly #runtimes = new Map<string, OperationalModuleRuntime<TContext, TRendered>>();

  register(runtime: OperationalModuleRuntime<TContext, TRendered>): void {
    validateManifest(runtime.manifest);
    const { workspaceType } = runtime.manifest;
    if (this.#runtimes.has(workspaceType)) {
      throw new DuplicateOperationalModuleRegistrationError(workspaceType);
    }
    this.#runtimes.set(workspaceType, runtime);
  }

  get(
    workspaceType: string,
  ): OperationalModuleRuntime<TContext, TRendered> | undefined {
    return this.#runtimes.get(workspaceType);
  }

  has(workspaceType: string): boolean {
    return this.#runtimes.has(workspaceType);
  }
}
