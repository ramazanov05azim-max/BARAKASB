'use client';

import { operationalWorkspaceDirectoryStorageKey } from './local-operational-workspace-directory';
import {
  legacyOperationalWorkspaceSessionStorageKey,
  operationalWorkspaceSessionStorageKey,
} from './local-operational-workspace-session';

export const legacyOperationalRuntimeStorageKeys = [
  'barakasb.local.operational-runtime-session.v1',
  legacyOperationalWorkspaceSessionStorageKey,
] as const;

export interface OperationalStorageMigrationResult {
  readonly removedLocalStorageKeys: ReadonlyArray<string>;
  readonly removedSessionStorageKeys: ReadonlyArray<string>;
  readonly migratedLocalStorageKeys: ReadonlyArray<string>;
}

type MigrationStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function migrateWorkspaceRecord(value: unknown): {
  readonly value: unknown;
  readonly changed: boolean;
} {
  if (typeof value !== 'object' || value === null) {
    return { value, changed: false };
  }
  const record = { ...value } as Record<string, unknown>;
  let changed = false;
  if (
    typeof record.businessEnvironmentId === 'string' &&
    typeof record.isolationScopeId !== 'string'
  ) {
    record.isolationScopeId = record.businessEnvironmentId;
    changed = true;
  }
  if ('businessEnvironmentId' in record) {
    delete record.businessEnvironmentId;
    changed = true;
  }
  if ('environmentDisplayName' in record) {
    delete record.environmentDisplayName;
    changed = true;
  }
  return { value: record, changed };
}

function migrateWorkspaceDirectory(storage: MigrationStorage): boolean {
  const stored = storage.getItem(operationalWorkspaceDirectoryStorageKey);
  if (!stored) return false;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return false;
    const migrated = parsed.map(migrateWorkspaceRecord);
    if (!migrated.some((entry) => entry.changed)) return false;
    storage.setItem(
      operationalWorkspaceDirectoryStorageKey,
      JSON.stringify(migrated.map((entry) => entry.value)),
    );
    return true;
  } catch {
    return false;
  }
}

function migrateWorkspaceBinding(storage: MigrationStorage): boolean {
  const stored = storage.getItem(operationalWorkspaceSessionStorageKey);
  if (!stored) return false;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || !('workspace' in parsed)) {
      return false;
    }
    const migrated = migrateWorkspaceRecord(parsed.workspace);
    if (!migrated.changed) return false;
    storage.setItem(
      operationalWorkspaceSessionStorageKey,
      JSON.stringify({ ...parsed, workspace: migrated.value }),
    );
    return true;
  } catch {
    return false;
  }
}

export function migrateOperationalStorage(
  localStorage: MigrationStorage,
  sessionStorage: MigrationStorage,
): OperationalStorageMigrationResult {
  const removedLocalStorageKeys: string[] = [];
  const removedSessionStorageKeys: string[] = [];
  const migratedLocalStorageKeys: string[] = [];

  for (const key of legacyOperationalRuntimeStorageKeys) {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removedLocalStorageKeys.push(key);
    }
    if (sessionStorage.getItem(key) !== null) {
      sessionStorage.removeItem(key);
      removedSessionStorageKeys.push(key);
    }
  }

  if (migrateWorkspaceDirectory(localStorage)) {
    migratedLocalStorageKeys.push(operationalWorkspaceDirectoryStorageKey);
  }
  if (migrateWorkspaceBinding(localStorage)) {
    migratedLocalStorageKeys.push(operationalWorkspaceSessionStorageKey);
  }

  return {
    removedLocalStorageKeys,
    removedSessionStorageKeys,
    migratedLocalStorageKeys,
  };
}

export function migrateLegacyOperationalStorage(): OperationalStorageMigrationResult {
  if (typeof window === 'undefined') {
    return {
      removedLocalStorageKeys: [],
      removedSessionStorageKeys: [],
      migratedLocalStorageKeys: [],
    };
  }
  return migrateOperationalStorage(window.localStorage, window.sessionStorage);
}
