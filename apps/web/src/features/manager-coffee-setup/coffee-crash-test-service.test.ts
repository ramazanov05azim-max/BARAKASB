import {
  coffeeCrashTestSeedId,
  coffeeEmployeeCredentialStoragePrefix,
  localCoffeeManagerRepositories,
} from '@barakasb/solution-coffee';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyPasswordCredential } from '@/features/universal-application/domain/employee-password';
import { createLocalBusinessEnvironmentDirectory } from './local-business-environment-directory';
import { createLocalOperationalWorkspaceDirectory } from '@/features/universal-application/infrastructure/local-operational-workspace-directory';
import { userLocalePreferenceStorageKey } from '@/i18n/user-locale-preference';
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
  coffeeCrashTestEmployeePassword,
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
  const workspaceDirectory = createLocalOperationalWorkspaceDirectory(
    window.localStorage,
  );
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
      coffee: localCoffeeManagerRepositories,
      workspaceAccess: workspaceDirectory.issuer,
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
    window.localStorage.setItem('unrelated-stale-data', 'remove-me');
    window.localStorage.setItem(
      userLocalePreferenceStorageKey,
      JSON.stringify({ locale: 'en' }),
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
    expect(window.localStorage.getItem('unrelated-stale-data')).toBeNull();
    expect(window.localStorage.getItem(userLocalePreferenceStorageKey)).toBe(
      JSON.stringify({ locale: 'en' }),
    );
    expect(
      window.localStorage.getItem(
        'barakasb.mock.coffee.project.v1.legacy-coffee-project',
      ),
    ).toBeNull();
    expect(clearOperationalSession).toHaveBeenCalled();
    const snapshot = await localCoffeeManagerRepositories.loadSnapshot(
      coffeeCrashTestProjectId,
    );
    expect(snapshot.developmentSeedId).toBe(coffeeCrashTestSeedId);
    expect(snapshot.solutionStructure.workspaces).toHaveLength(2);
    expect(snapshot.employees).toHaveLength(5);
    for (const employee of snapshot.employees) {
      const credential = await localCoffeeManagerRepositories.employeeCredentials.get(
        coffeeCrashTestProjectId,
        employee.id,
      );
      expect(credential).not.toBeNull();
      await expect(
        verifyPasswordCredential(coffeeCrashTestEmployeePassword, credential!),
      ).resolves.toBe(true);
    }
    const storedCredentials = window.localStorage.getItem(
      `${coffeeEmployeeCredentialStoragePrefix}.${encodeURIComponent(
        coffeeCrashTestProjectId,
      )}`,
    );
    expect(storedCredentials).not.toContain(coffeeCrashTestEmployeePassword);
    await expect(
      createLocalOperationalWorkspaceDirectory(window.localStorage).resolver.resolve(
        '672801751693',
      ),
    ).resolves.toMatchObject({
      projectId: coffeeCrashTestProjectId,
      workspaceType: 'bar',
      workspaceName: 'Бар',
      assignedEmployees: [
        { employeeId: 'crash-employee-barista', displayName: 'Иван Беляев' },
        { employeeId: 'crash-employee-cashier', displayName: 'Анна Лукина' },
      ],
    });
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
  }, 20_000);
});
