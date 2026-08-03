'use client';

import type {
  OperationalWorkspaceSession,
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from '../application/workspace-access';

export const operationalWorkspaceSessionStorageKey =
  'barakasb.operational-workspace.device.v2';
export const legacyOperationalWorkspaceSessionStorageKey =
  'barakasb.operational-workspace.session.v1';

export interface SessionStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isWorkspace(value: unknown): value is ResolvedOperationalWorkspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    'projectId' in value &&
    typeof value.projectId === 'string' &&
    'workspaceId' in value &&
    typeof value.workspaceId === 'string' &&
    'assignedEmployees' in value &&
    Array.isArray(value.assignedEmployees)
  );
}

function readSession(storage: SessionStoragePort): OperationalWorkspaceSession | null {
  const stored = storage.getItem(operationalWorkspaceSessionStorageKey);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('workspace' in parsed) ||
      !isWorkspace(parsed.workspace) ||
      !('currentEmployeeId' in parsed) ||
      (parsed.currentEmployeeId !== null &&
        typeof parsed.currentEmployeeId !== 'string')
    ) {
      return null;
    }
    return parsed as OperationalWorkspaceSession;
  } catch {
    return null;
  }
}

export function createOperationalWorkspaceSessionStore(
  storage: SessionStoragePort,
): OperationalWorkspaceSessionStore {
  return {
    authorize(workspace) {
      const session: OperationalWorkspaceSession = {
        workspace: structuredClone(workspace),
        currentEmployeeId: null,
      };
      storage.setItem(operationalWorkspaceSessionStorageKey, JSON.stringify(session));
    },
    read(projectId, workspaceId) {
      const session = readSession(storage);
      return session?.workspace.projectId === projectId &&
        session.workspace.workspaceId === workspaceId
        ? structuredClone(session)
        : null;
    },
    readConnected() {
      const session = readSession(storage);
      return session ? structuredClone(session) : null;
    },
    authenticateEmployee(projectId, workspaceId, employeeId) {
      const session = readSession(storage);
      if (
        !session ||
        session.workspace.projectId !== projectId ||
        session.workspace.workspaceId !== workspaceId
      ) {
        return null;
      }
      if (
        !session.workspace.assignedEmployees.some(
          (employee) => employee.employeeId === employeeId,
        )
      ) {
        return null;
      }
      const updated: OperationalWorkspaceSession = {
        ...session,
        currentEmployeeId: employeeId,
      };
      storage.setItem(operationalWorkspaceSessionStorageKey, JSON.stringify(updated));
      return structuredClone(updated);
    },
    logoutEmployee(projectId, workspaceId) {
      const session = readSession(storage);
      if (
        !session ||
        session.workspace.projectId !== projectId ||
        session.workspace.workspaceId !== workspaceId
      ) {
        return null;
      }
      const updated: OperationalWorkspaceSession = {
        ...session,
        currentEmployeeId: null,
      };
      storage.setItem(operationalWorkspaceSessionStorageKey, JSON.stringify(updated));
      return structuredClone(updated);
    },
    clear() {
      storage.removeItem(operationalWorkspaceSessionStorageKey);
      storage.removeItem(legacyOperationalWorkspaceSessionStorageKey);
    },
  };
}

function browserSession(): OperationalWorkspaceSessionStore {
  if (typeof window === 'undefined') {
    throw new Error('local-operational-workspace-session-browser-only');
  }
  return createOperationalWorkspaceSessionStore(window.localStorage);
}

export const localOperationalWorkspaceSession: OperationalWorkspaceSessionStore = {
  authorize: (workspace) => browserSession().authorize(workspace),
  readConnected: () => browserSession().readConnected(),
  read: (projectId, workspaceId) => browserSession().read(projectId, workspaceId),
  authenticateEmployee: (projectId, workspaceId, employeeId) =>
    browserSession().authenticateEmployee(projectId, workspaceId, employeeId),
  logoutEmployee: (projectId, workspaceId) =>
    browserSession().logoutEmployee(projectId, workspaceId),
  clear: () => browserSession().clear(),
};
