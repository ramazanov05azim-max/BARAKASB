import { localCoffeeManagerRepositories } from '@barakasb/solution-coffee';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalBusinessEnvironmentDirectory } from '@/features/universal-application/infrastructure/local-business-environment-directory';
import {
  mockRepository,
  projectStorageKey,
  type ProjectSummary,
} from '@/lib/mock-repository';
import {
  coffeeCrashTestProjectId,
  createCoffeeManagerSetupRepository,
} from './coffee-manager-setup-repository';
import {
  coffeeCrashTestSchemaKey,
  createCoffeeCrashTestService,
  obsoleteLocalStorageKeys,
  selectedProjectStorageKey,
} from './coffee-crash-test-service';

function legacyProject(): ProjectSummary {
  return {
    id: 'legacy-coffee-project',
    name: 'Legacy Demo',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

function createHarness() {
  const directory = createLocalBusinessEnvironmentDirectory(window.localStorage);
  const manager = createCoffeeManagerSetupRepository({
    storage: window.localStorage,
    platformProjects: mockRepository,
    coffeeRepositories: localCoffeeManagerRepositories,
    directory: directory.writer,
  });
  const clearOperationalSession = vi.fn();
  return {
    manager,
    directory,
    clearOperationalSession,
    service: createCoffeeCrashTestService({
      localStorage: window.localStorage,
      platformProjects: mockRepository,
      manager,
      directory: directory.maintenance,
      resolver: directory.resolver,
      clearOperationalSession,
      enabled: true,
    }),
  };
}

describe('Coffee crash-test DEV lifecycle', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not mutate local state during inspection', async () => {
    window.localStorage.setItem(projectStorageKey, JSON.stringify([legacyProject()]));
    const before = window.localStorage.getItem(projectStorageKey);

    const state = await createHarness().service.inspect();

    expect(state.status).toBe('reset-required');
    expect(window.localStorage.getItem(projectStorageKey)).toBe(before);
    expect(state.record).toBeNull();
  });

  it('removes stale data and installs exactly one canonical environment', async () => {
    window.localStorage.setItem(projectStorageKey, JSON.stringify([legacyProject()]));
    for (const key of obsoleteLocalStorageKeys) {
      window.localStorage.setItem(key, 'stale');
    }
    window.localStorage.setItem(
      'barakasb.mock.coffee.project.v1.legacy-coffee-project',
      '{"legacy":true}',
    );
    const { service, clearOperationalSession } = createHarness();

    const state = await service.resetAndInstall();

    expect(state.status).toBe('installed');
    expect(state.diagnostics).toMatchObject({
      projectCount: 1,
      installationCount: 1,
      environmentCount: 1,
      selectedProjectId: coffeeCrashTestProjectId,
      obsoleteKeyCount: 0,
      schemaVersion: 2,
    });
    expect(state.record?.project.id).toBe(coffeeCrashTestProjectId);
    expect(state.record?.businessEnvironmentCode).toMatch(/^\d{16}$/);
    expect(window.localStorage.getItem(coffeeCrashTestSchemaKey)).toBe('2');
    expect(window.localStorage.getItem(selectedProjectStorageKey)).toBe(
      coffeeCrashTestProjectId,
    );
    expect(
      window.localStorage.getItem(
        'barakasb.mock.coffee.project.v1.legacy-coffee-project',
      ),
    ).toBeNull();
    expect(clearOperationalSession).toHaveBeenCalled();
  });

  it('is deterministic on reinstall and does not recreate after delete', async () => {
    const { service } = createHarness();
    const first = await service.resetAndInstall();
    const second = await service.resetAndInstall();

    expect(second.record?.businessEnvironmentCode).toBe(
      first.record?.businessEnvironmentCode,
    );

    const deleted = await service.delete();
    expect(deleted.status).toBe('not-installed');
    expect(deleted.record).toBeNull();
    expect(await mockRepository.listProjects()).toHaveLength(0);

    const inspectedAgain = await service.inspect();
    expect(inspectedAgain.status).toBe('not-installed');
    expect(inspectedAgain.record).toBeNull();
  });
});
