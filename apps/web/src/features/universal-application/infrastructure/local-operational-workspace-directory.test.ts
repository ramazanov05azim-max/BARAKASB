import { beforeEach, describe, expect, it } from 'vitest';
import type { OperationalWorkspaceAccessInput } from '../application/workspace-access';
import { createLocalOperationalWorkspaceDirectory } from './local-operational-workspace-directory';

const bar: OperationalWorkspaceAccessInput = {
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  isolationScopeId: 'environment-1',
  workspaceId: 'workspace-bar',
  workspaceType: 'bar',
  workspaceName: 'Бар',
  assignedEmployees: [],
};

describe('local Operational Workspace directory', () => {
  beforeEach(() => window.localStorage.clear());

  it('issues a unique immutable 12-digit code and resolves it after refresh', async () => {
    const firstDirectory = createLocalOperationalWorkspaceDirectory(
      window.localStorage,
      () => '2026-07-31T10:00:00.000Z',
    );
    const first = await firstDirectory.issuer.issue(bar);
    const repeated = await firstDirectory.issuer.issue({
      ...bar,
      assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Анна' }],
    });

    expect(first.accessCode).toMatch(/^\d{12}$/);
    expect(repeated.accessCode).toBe(first.accessCode);
    expect(
      await createLocalOperationalWorkspaceDirectory(
        window.localStorage,
      ).resolver.resolve(first.accessCode),
    ).toEqual(first);
  });

  it('keeps employees outside code identity while synchronizing assignments', async () => {
    const directory = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const issued = await directory.issuer.issue(bar);
    const updated = await directory.issuer.sync({
      ...bar,
      assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Анна' }],
    });

    expect(updated?.accessCode).toBe(issued.accessCode);
    expect(updated?.assignedEmployees).toEqual([
      { employeeId: 'employee-1', displayName: 'Анна' },
    ]);
  });

  it('keeps project workspaces isolated and removes deselected modules', async () => {
    const directory = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const first = await directory.issuer.issue(bar);
    const second = await directory.issuer.issue({
      ...bar,
      projectId: 'coffee-2',
      isolationScopeId: 'environment-2',
    });
    await directory.issuer.removeUnavailable(
      'coffee-1',
      new Set(['workspace-manager']),
    );

    await expect(directory.resolver.resolve(first.accessCode)).resolves.toBeNull();
    await expect(directory.resolver.resolve(second.accessCode)).resolves.toEqual(
      second,
    );
  });

  it('rotates a code explicitly and invalidates the previous code', async () => {
    const directory = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const first = await directory.issuer.issue(bar);
    const rotated = await directory.issuer.rotate(bar);

    expect(rotated.accessCode).not.toBe(first.accessCode);
    expect(rotated.accessCode).toMatch(/^\d{12}$/u);
    await expect(directory.resolver.resolve(first.accessCode)).resolves.toBeNull();
    await expect(directory.resolver.resolve(rotated.accessCode)).resolves.toEqual(
      rotated,
    );
  });
});
