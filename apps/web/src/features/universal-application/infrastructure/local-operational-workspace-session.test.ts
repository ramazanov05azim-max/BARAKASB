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
  businessEnvironmentId: 'environment-1',
  environmentDisplayName: 'Север',
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
    expect(refreshed.read('coffee-1', 'workspace-bar')?.currentEmployeeId).toBeNull();
  });

  it('changes employee without deleting the saved workspace connection', () => {
    const deviceStorage = storage();
    const session = createOperationalWorkspaceSessionStore(deviceStorage);
    session.authorize(workspace);
    expect(
      session.authenticateEmployee('coffee-1', 'workspace-bar', 'employee-1')
        ?.currentEmployeeId,
    ).toBe('employee-1');

    expect(
      session.logoutEmployee('coffee-1', 'workspace-bar')?.currentEmployeeId,
    ).toBeNull();
    expect(session.readConnected()?.workspace.accessCode).toBe('123456789012');

    session.clear();
    expect(deviceStorage.getItem(operationalWorkspaceSessionStorageKey)).toBeNull();
  });

  it('does not authenticate an employee who is not assigned', () => {
    const session = createOperationalWorkspaceSessionStore(storage());
    session.authorize(workspace);
    expect(
      session.authenticateEmployee('coffee-1', 'workspace-bar', 'employee-2'),
    ).toBeNull();
  });
});
