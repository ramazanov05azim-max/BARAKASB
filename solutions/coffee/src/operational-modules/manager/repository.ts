'use client';

import type { ManagerPreferences } from './domain';

export const coffeeManagerWorkspaceStoragePrefix =
  'barakasb.mock.coffee.manager-workspace.v1';
const sameTabEvent = 'barakasb:coffee-manager-workspace-changed';

export interface CoffeeManagerWorkspaceRepository {
  load(
    projectId: string,
    businessEnvironmentId: string,
    employeeId: string,
  ): Promise<ManagerPreferences>;
  save(
    projectId: string,
    businessEnvironmentId: string,
    employeeId: string,
    preferences: ManagerPreferences,
  ): Promise<ManagerPreferences>;
  subscribe(projectId: string, listener: () => void): () => void;
}

const defaults = (): ManagerPreferences => ({
  schemaVersion: 1,
  selectedSection: 'overview',
  warningsOnly: false,
  hiddenPanelKeys: [],
});

const key = (projectId: string, environmentId: string, employeeId: string): string =>
  `${coffeeManagerWorkspaceStoragePrefix}.${encodeURIComponent(projectId)}.${encodeURIComponent(environmentId)}.${encodeURIComponent(employeeId)}`;

function storage(): Storage {
  if (typeof window === 'undefined') throw new Error('manager-workspace-browser-only');
  return window.localStorage;
}

function read(
  projectId: string,
  environmentId: string,
  employeeId: string,
): ManagerPreferences {
  const raw = storage().getItem(key(projectId, environmentId, employeeId));
  if (!raw) return defaults();
  try {
    const parsed = JSON.parse(raw) as Partial<ManagerPreferences>;
    const sections = ['overview', 'purchasing', 'warehouse', 'events', 'warnings'];
    return {
      schemaVersion: 1,
      selectedSection: sections.includes(parsed.selectedSection ?? '')
        ? (parsed.selectedSection as ManagerPreferences['selectedSection'])
        : 'overview',
      warningsOnly: parsed.warningsOnly === true,
      hiddenPanelKeys: Array.isArray(parsed.hiddenPanelKeys)
        ? parsed.hiddenPanelKeys.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
    };
  } catch {
    return defaults();
  }
}

export function createLocalCoffeeManagerWorkspaceRepository(): CoffeeManagerWorkspaceRepository {
  return {
    async load(projectId, environmentId, employeeId) {
      return structuredClone(read(projectId, environmentId, employeeId));
    },
    async save(projectId, environmentId, employeeId, preferences) {
      const normalized: ManagerPreferences = {
        schemaVersion: 1,
        selectedSection: preferences.selectedSection,
        warningsOnly: preferences.warningsOnly,
        hiddenPanelKeys: [...new Set(preferences.hiddenPanelKeys)],
      };
      storage().setItem(
        key(projectId, environmentId, employeeId),
        JSON.stringify(normalized),
      );
      window.dispatchEvent(new CustomEvent(sameTabEvent, { detail: { projectId } }));
      return structuredClone(normalized);
    },
    subscribe(projectId, listener) {
      const onStorage = (event: StorageEvent): void => {
        if (
          event.key?.startsWith(
            `${coffeeManagerWorkspaceStoragePrefix}.${encodeURIComponent(projectId)}.`,
          )
        )
          listener();
      };
      const onLocal = (event: Event): void => {
        if (
          (event as CustomEvent<{ projectId: string }>).detail.projectId === projectId
        )
          listener();
      };
      window.addEventListener('storage', onStorage);
      window.addEventListener(sameTabEvent, onLocal);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(sameTabEvent, onLocal);
      };
    },
  };
}

export const localCoffeeManagerWorkspaceRepository =
  createLocalCoffeeManagerWorkspaceRepository();
