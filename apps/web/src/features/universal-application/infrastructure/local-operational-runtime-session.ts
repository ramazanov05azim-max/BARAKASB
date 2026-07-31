'use client';

import type {
  OperationalRuntimeSessionStore,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';

const sessionKey = 'barakasb.local.operational-runtime-session.v1';

export function createOperationalRuntimeSessionStore(
  storage: Storage,
): OperationalRuntimeSessionStore {
  return {
    authorize(environment) {
      storage.setItem(sessionKey, JSON.stringify(environment));
    },
    read(projectId) {
      const value = storage.getItem(sessionKey);
      if (!value) return null;
      try {
        const parsed = JSON.parse(value) as ResolvedBusinessEnvironment;
        return parsed.projectId === projectId ? structuredClone(parsed) : null;
      } catch {
        return null;
      }
    },
    clear() {
      storage.removeItem(sessionKey);
    },
  };
}

function browserSessionStore(): OperationalRuntimeSessionStore {
  if (typeof window === 'undefined') {
    throw new Error('operational-runtime-session-browser-only');
  }
  return createOperationalRuntimeSessionStore(window.sessionStorage);
}

export const localOperationalRuntimeSession: OperationalRuntimeSessionStore = {
  authorize: (environment) => browserSessionStore().authorize(environment),
  read: (projectId) => browserSessionStore().read(projectId),
  clear: () => browserSessionStore().clear(),
};
