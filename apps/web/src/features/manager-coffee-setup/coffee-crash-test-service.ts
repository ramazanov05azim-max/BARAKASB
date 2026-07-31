'use client';

import { clearLocalCoffeeDevelopmentStorage } from '@barakasb/solution-coffee';
import type {
  BusinessEnvironmentDirectoryMaintenance,
  BusinessEnvironmentResolver,
} from '@/features/universal-application/application/business-environment-resolution';
import {
  directoryStorageKey,
  legacyCoffeeStorageKey,
  localBusinessEnvironmentDirectoryMaintenance,
  localBusinessEnvironmentResolver,
} from '@/features/universal-application/infrastructure/local-business-environment-directory';
import {
  localOperationalRuntimeSession,
  operationalRuntimeSessionKey,
} from '@/features/universal-application/infrastructure/local-operational-runtime-session';
import {
  mockRepository,
  projectStorageKey,
  type MockRepository,
} from '@/lib/mock-repository';
import {
  coffeeCrashTestProjectId,
  coffeeManagerStorageKey,
  legacyCoffeeDemoRemovalKey,
  legacyCoffeeManagerStorageKey,
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRecord,
  type CoffeeManagerSetupRepository,
} from './coffee-manager-setup-repository';

export const coffeeCrashTestSchemaKey = 'barakasb.dev.coffee-crash-test.schema.v2';
export const selectedProjectStorageKey = 'barakasb.manager.selected-project.v1';

export const obsoleteLocalStorageKeys = [
  'barakasb.mock.projects.v1',
  'barakasb.mock.selected-project.v1',
  'barakasb.selected-project.v1',
  'barakasb.local.coffee.projects.v1',
  legacyCoffeeManagerStorageKey,
  legacyCoffeeDemoRemovalKey,
  legacyCoffeeStorageKey,
] as const;

export const canonicalLocalStorageKeys = [
  projectStorageKey,
  coffeeManagerStorageKey,
  directoryStorageKey,
  selectedProjectStorageKey,
  coffeeCrashTestSchemaKey,
] as const;

export const obsoleteStoragePrefixes = [
  'barakasb.mock.coffee.project.v0.',
  'barakasb.local.coffee.onboarding.',
] as const;

export interface CoffeeCrashTestDiagnostics {
  projectCount: number;
  installationCount: number;
  environmentCount: number;
  selectedProjectId: string | null;
  obsoleteKeyCount: number;
  schemaVersion: number | null;
}

export interface CoffeeCrashTestState {
  status: 'not-installed' | 'installed' | 'reset-required';
  record: CoffeeManagerSetupRecord | null;
  diagnostics: CoffeeCrashTestDiagnostics;
}

export interface CoffeeCrashTestService {
  inspect(): Promise<CoffeeCrashTestState>;
  resetAndInstall(): Promise<CoffeeCrashTestState>;
  delete(): Promise<CoffeeCrashTestState>;
}

interface CoffeeCrashTestDependencies {
  localStorage: Storage;
  platformProjects: Pick<MockRepository, 'listProjects' | 'clearProjects'>;
  manager: CoffeeManagerSetupRepository;
  directory: BusinessEnvironmentDirectoryMaintenance;
  resolver: BusinessEnvironmentResolver;
  clearOperationalSession(): void;
  enabled: boolean;
}

function storageKeys(storage: Storage): string[] {
  return Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => Boolean(key));
}

function obsoleteKeys(storage: Storage): string[] {
  return storageKeys(storage).filter(
    (key) =>
      obsoleteLocalStorageKeys.includes(
        key as (typeof obsoleteLocalStorageKeys)[number],
      ) || obsoleteStoragePrefixes.some((prefix) => key.startsWith(prefix)),
  );
}

export function createCoffeeCrashTestService(
  dependencies: CoffeeCrashTestDependencies,
): CoffeeCrashTestService {
  function assertEnabled(): void {
    if (!dependencies.enabled) throw new Error('coffee-crash-test-disabled');
  }

  async function diagnostics(): Promise<CoffeeCrashTestDiagnostics> {
    const projects = await dependencies.platformProjects.listProjects();
    const installations = await dependencies.manager.list();
    const rawSchema = dependencies.localStorage.getItem(coffeeCrashTestSchemaKey);
    return {
      projectCount: projects.length,
      installationCount: installations.length,
      environmentCount: await dependencies.directory.count(),
      selectedProjectId: dependencies.localStorage.getItem(selectedProjectStorageKey),
      obsoleteKeyCount: obsoleteKeys(dependencies.localStorage).length,
      schemaVersion: rawSchema ? Number(rawSchema) : null,
    };
  }

  async function inspect(): Promise<CoffeeCrashTestState> {
    assertEnabled();
    const record = await dependencies.manager.get(coffeeCrashTestProjectId);
    const summary = await diagnostics();
    const resolved =
      record?.businessEnvironmentCode === null ||
      record?.businessEnvironmentCode === undefined
        ? null
        : await dependencies.resolver.resolve(record.businessEnvironmentCode);
    const exactCanonicalState =
      record !== null &&
      record.businessEnvironmentCode !== null &&
      resolved?.projectId === coffeeCrashTestProjectId &&
      resolved.businessEnvironmentId === record.businessEnvironmentId &&
      summary.projectCount === 1 &&
      summary.installationCount === 1 &&
      summary.environmentCount === 1 &&
      summary.selectedProjectId === coffeeCrashTestProjectId &&
      summary.obsoleteKeyCount === 0 &&
      summary.schemaVersion === 2;
    const hasAnyLocalTestData =
      summary.projectCount > 0 ||
      summary.installationCount > 0 ||
      summary.environmentCount > 0 ||
      summary.obsoleteKeyCount > 0;
    return {
      status: exactCanonicalState
        ? 'installed'
        : hasAnyLocalTestData
          ? 'reset-required'
          : 'not-installed',
      record,
      diagnostics: summary,
    };
  }

  async function clearAllLocalTestData(): Promise<void> {
    await dependencies.platformProjects.clearProjects();
    await dependencies.directory.clear();
    dependencies.clearOperationalSession();
    clearLocalCoffeeDevelopmentStorage(dependencies.localStorage);
    dependencies.localStorage.removeItem(coffeeManagerStorageKey);
    dependencies.localStorage.removeItem(selectedProjectStorageKey);
    dependencies.localStorage.removeItem(coffeeCrashTestSchemaKey);
    for (const key of obsoleteKeys(dependencies.localStorage)) {
      dependencies.localStorage.removeItem(key);
    }
  }

  return {
    inspect,
    async resetAndInstall() {
      assertEnabled();
      await clearAllLocalTestData();
      const record = await dependencies.manager.installCrashTest();
      dependencies.localStorage.setItem(
        selectedProjectStorageKey,
        coffeeCrashTestProjectId,
      );
      dependencies.localStorage.setItem(coffeeCrashTestSchemaKey, '2');
      const result = await inspect();
      if (
        result.status !== 'installed' ||
        result.record?.businessEnvironmentCode !== record.businessEnvironmentCode
      ) {
        throw new Error('coffee-crash-test-postcondition-failed');
      }
      return result;
    },
    async delete() {
      assertEnabled();
      await dependencies.manager.deleteCrashTest();
      dependencies.localStorage.removeItem(selectedProjectStorageKey);
      dependencies.clearOperationalSession();
      return inspect();
    },
  };
}

function browserService(): CoffeeCrashTestService {
  if (typeof window === 'undefined') {
    throw new Error('coffee-crash-test-browser-only');
  }
  return createCoffeeCrashTestService({
    localStorage: window.localStorage,
    platformProjects: mockRepository,
    manager: localCoffeeManagerSetupRepository,
    directory: localBusinessEnvironmentDirectoryMaintenance,
    resolver: localBusinessEnvironmentResolver,
    clearOperationalSession: () => localOperationalRuntimeSession.clear(),
    enabled:
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_COFFEE_CRASH_TEST === 'true',
  });
}

export const localCoffeeCrashTestService: CoffeeCrashTestService = {
  inspect: () => browserService().inspect(),
  resetAndInstall: () => browserService().resetAndInstall(),
  delete: () => browserService().delete(),
};

export const developmentStorageAudit = {
  canonicalLocalStorageKeys,
  obsoleteLocalStorageKeys,
  obsoleteStoragePrefixes,
  sessionStorageKeys: [operationalRuntimeSessionKey],
} as const;
