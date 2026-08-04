import { describe, expect, it } from 'vitest';
import type { ResolvedOperationalWorkspace } from '../application/workspace-access';
import {
  createOperationalWorkspaceSessionStore,
  operationalWorkspaceSessionStorageKey,
  type SessionStoragePort,
} from './local-operational-workspace-session';

function storage(): SessionStoragePort {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const workspace: ResolvedOperationalWorkspace = {
  accessCode: '123456789012',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  isolationScopeId: 'environment-1',
  workspaceId: 'workspace-bar',
  workspaceType: 'bar',
  workspaceName: 'Бар',
  assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Иван Петров' }],
  createdAt: '2026-08-04T10:00:00.000Z',
};

describe('local operational workspace device session', () => {
  it('persists the connected workspace across store recreation', () => {
    const deviceStorage = storage();
    createOperationalWorkspaceSessionStore(deviceStorage).authorize(workspace);

    const refreshed = createOperationalWorkspaceSessionStore(deviceStorage);
    expect(refreshed.readConnected()?.workspace.workspaceId).toBe('workspace-bar');
    expect(refreshed.readConnected()?.currentEmployeeId).toBeNull();
  });

  it('changes employee without deleting the saved workspace connection', () => {
    const deviceStorage = storage();
    const session = createOperationalWorkspaceSessionStore(deviceStorage);
    session.authorize(workspace);
    expect(session.authenticateEmployee('employee-1')?.currentEmployeeId).toBe(
      'employee-1',
    );

    expect(session.logoutEmployee()?.currentEmployeeId).toBeNull();
    expect(session.readConnected()?.workspace.accessCode).toBe('123456789012');

    session.clear();
    expect(deviceStorage.getItem(operationalWorkspaceSessionStorageKey)).toBeNull();
  });

  it('does not authenticate an employee who is not assigned', () => {
    const session = createOperationalWorkspaceSessionStore(storage());
    session.authorize(workspace);
    expect(session.authenticateEmployee('employee-2')).toBeNull();
  });

  it('allows Manager Platform to disconnect only the matching workspace', () => {
    const deviceStorage = storage();
    const session = createOperationalWorkspaceSessionStore(deviceStorage);
    session.authorize(workspace);

    expect(session.disconnect('coffee-2', 'workspace-bar')).toBe(false);
    expect(session.readConnected()).not.toBeNull();
    expect(session.disconnect('coffee-1', 'workspace-bar')).toBe(true);
    expect(session.readConnected()).toBeNull();
  });
});
