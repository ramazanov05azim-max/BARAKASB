import { describe, expect, it } from 'vitest';
import {
  legacyOperationalRuntimeStorageKeys,
  migrateOperationalStorage,
} from './local-operational-storage-migration';
import { operationalWorkspaceDirectoryStorageKey } from './local-operational-workspace-directory';
import { operationalWorkspaceSessionStorageKey } from './local-operational-workspace-session';

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('operational storage migration', () => {
  it('removes legacy runtime records and preserves canonical operational data', () => {
    const local = storage();
    const session = storage();
    local.setItem(operationalWorkspaceSessionStorageKey, '{"workspace":"current"}');
    local.setItem('barakasb.mock.coffee.project.v1.coffee-1', '{"solution":"keep"}');
    local.setItem('barakasb.mock.coffee.employee-credentials.v1.coffee-1', '[]');
    for (const key of legacyOperationalRuntimeStorageKeys) {
      local.setItem(key, 'legacy');
      session.setItem(key, 'legacy');
    }

    const result = migrateOperationalStorage(local, session);

    expect(result.removedLocalStorageKeys).toEqual([
      ...legacyOperationalRuntimeStorageKeys,
    ]);
    expect(result.removedSessionStorageKeys).toEqual([
      ...legacyOperationalRuntimeStorageKeys,
    ]);
    expect(result.migratedLocalStorageKeys).toEqual([]);
    expect(local.getItem(operationalWorkspaceSessionStorageKey)).not.toBeNull();
    expect(local.getItem('barakasb.mock.coffee.project.v1.coffee-1')).not.toBeNull();
    expect(
      local.getItem('barakasb.mock.coffee.employee-credentials.v1.coffee-1'),
    ).not.toBeNull();
  });

  it('migrates the current Workspace directory and device binding without losing them', () => {
    const local = storage();
    const session = storage();
    const workspace = {
      projectId: 'coffee-1',
      businessEnvironmentId: 'environment-1',
      environmentDisplayName: 'Север',
      workspaceId: 'workspace-bar',
    };
    local.setItem(operationalWorkspaceDirectoryStorageKey, JSON.stringify([workspace]));
    local.setItem(
      operationalWorkspaceSessionStorageKey,
      JSON.stringify({ workspace, currentEmployeeId: 'employee-1' }),
    );

    const result = migrateOperationalStorage(local, session);

    expect(result.migratedLocalStorageKeys).toEqual([
      operationalWorkspaceDirectoryStorageKey,
      operationalWorkspaceSessionStorageKey,
    ]);
    expect(local.getItem(operationalWorkspaceDirectoryStorageKey)).toContain(
      '"isolationScopeId":"environment-1"',
    );
    expect(local.getItem(operationalWorkspaceSessionStorageKey)).toContain(
      '"isolationScopeId":"environment-1"',
    );
    expect(local.getItem(operationalWorkspaceDirectoryStorageKey)).not.toContain(
      'businessEnvironmentId',
    );
    expect(local.getItem(operationalWorkspaceSessionStorageKey)).not.toContain(
      'environmentDisplayName',
    );
  });

  it('is idempotent', () => {
    const local = storage();
    const session = storage();

    expect(migrateOperationalStorage(local, session)).toEqual({
      removedLocalStorageKeys: [],
      removedSessionStorageKeys: [],
      migratedLocalStorageKeys: [],
    });
  });
});
