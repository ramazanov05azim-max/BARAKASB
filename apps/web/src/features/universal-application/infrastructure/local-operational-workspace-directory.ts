'use client';

import type {
  OperationalWorkspaceAccessInput,
  OperationalWorkspaceAccessIssuer,
  OperationalWorkspaceAccessResolver,
  ResolvedOperationalWorkspace,
} from '../application/workspace-access';
import {
  isWorkspaceAccessCodeComplete,
  normalizeWorkspaceAccessCode,
} from '../domain/workspace-access-code';

export const operationalWorkspaceDirectoryStorageKey =
  'barakasb.local.operational-workspace.directory.v1';

const codeSpace = 1_000_000_000_000n;
const fnvOffsetBasis = 14_695_981_039_346_656_037n;
const fnvPrime = 1_099_511_628_211n;
const unsigned64Mask = (1n << 64n) - 1n;

export interface LocalOperationalWorkspaceDirectory {
  resolver: OperationalWorkspaceAccessResolver;
  issuer: OperationalWorkspaceAccessIssuer;
}

function hashToCode(value: string): string {
  let hash = fnvOffsetBasis;
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = (hash * fnvPrime) & unsigned64Mask;
  }
  return (hash % codeSpace).toString().padStart(12, '0');
}

function isWorkspace(value: unknown): value is ResolvedOperationalWorkspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessCode' in value &&
    typeof value.accessCode === 'string' &&
    isWorkspaceAccessCodeComplete(value.accessCode) &&
    'projectId' in value &&
    typeof value.projectId === 'string' &&
    'solutionInstallationId' in value &&
    typeof value.solutionInstallationId === 'string' &&
    'businessEnvironmentId' in value &&
    typeof value.businessEnvironmentId === 'string' &&
    'workspaceId' in value &&
    typeof value.workspaceId === 'string' &&
    'workspaceName' in value &&
    typeof value.workspaceName === 'string' &&
    'assignedEmployees' in value &&
    Array.isArray(value.assignedEmployees)
  );
}

function readEntries(storage: Storage): ResolvedOperationalWorkspace[] {
  const stored = storage.getItem(operationalWorkspaceDirectoryStorageKey);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isWorkspace).map((entry) => ({
          ...entry,
          workspaceType:
            typeof (entry as Partial<ResolvedOperationalWorkspace>).workspaceType ===
            'string'
              ? (entry as ResolvedOperationalWorkspace).workspaceType
              : entry.workspaceId.replace(/^workspace-/u, ''),
        }))
      : [];
  } catch {
    return [];
  }
}

function writeEntries(
  storage: Storage,
  entries: ReadonlyArray<ResolvedOperationalWorkspace>,
): void {
  storage.setItem(operationalWorkspaceDirectoryStorageKey, JSON.stringify(entries));
}

function workspaceKey(
  value: Pick<OperationalWorkspaceAccessInput, 'projectId' | 'workspaceId'>,
): string {
  return `${value.projectId}:${value.workspaceId}`;
}

function generateCode(
  input: OperationalWorkspaceAccessInput,
  entries: ReadonlyArray<ResolvedOperationalWorkspace>,
): string {
  const occupied = new Set(entries.map((entry) => entry.accessCode));
  const seed = [
    input.solutionInstallationId,
    input.businessEnvironmentId,
    input.workspaceId,
  ].join('|');
  for (let attempt = 0; attempt < Number.MAX_SAFE_INTEGER; attempt += 1) {
    const candidate = hashToCode(`${seed}|${attempt}`);
    if (!occupied.has(candidate)) return candidate;
  }
  throw new Error('workspace-access-code-space-exhausted');
}

export function createLocalOperationalWorkspaceDirectory(
  storage: Storage,
  now: () => string = () => new Date().toISOString(),
): LocalOperationalWorkspaceDirectory {
  return {
    resolver: {
      async resolve(code) {
        const normalized = normalizeWorkspaceAccessCode(code);
        if (!isWorkspaceAccessCodeComplete(normalized)) return null;
        const entry = readEntries(storage).find(
          (candidate) => candidate.accessCode === normalized,
        );
        return entry ? structuredClone(entry) : null;
      },
    },
    issuer: {
      async issue(input) {
        const entries = readEntries(storage);
        const key = workspaceKey(input);
        const existing = entries.find((candidate) => workspaceKey(candidate) === key);
        if (existing) return structuredClone(existing);
        const created: ResolvedOperationalWorkspace = {
          ...input,
          assignedEmployees: structuredClone(input.assignedEmployees),
          accessCode: generateCode(input, entries),
          createdAt: now(),
        };
        writeEntries(storage, [...entries, created]);
        return structuredClone(created);
      },
      async listByProject(projectId) {
        return structuredClone(
          readEntries(storage).filter((entry) => entry.projectId === projectId),
        );
      },
      async sync(input) {
        const entries = readEntries(storage);
        const key = workspaceKey(input);
        const index = entries.findIndex((candidate) => workspaceKey(candidate) === key);
        const existing = entries[index];
        if (!existing) return null;
        const updated: ResolvedOperationalWorkspace = {
          ...existing,
          ...input,
          assignedEmployees: structuredClone(input.assignedEmployees),
          accessCode: existing.accessCode,
          createdAt: existing.createdAt,
        };
        entries[index] = updated;
        writeEntries(storage, entries);
        return structuredClone(updated);
      },
      async removeUnavailable(projectId, workspaceIds) {
        writeEntries(
          storage,
          readEntries(storage).filter(
            (entry) =>
              entry.projectId !== projectId || workspaceIds.has(entry.workspaceId),
          ),
        );
      },
      async removeProject(projectId) {
        writeEntries(
          storage,
          readEntries(storage).filter((entry) => entry.projectId !== projectId),
        );
      },
    },
  };
}

function browserDirectory(): LocalOperationalWorkspaceDirectory {
  if (typeof window === 'undefined') {
    throw new Error('local-operational-workspace-directory-browser-only');
  }
  return createLocalOperationalWorkspaceDirectory(window.localStorage);
}

export const localOperationalWorkspaceResolver: OperationalWorkspaceAccessResolver = {
  resolve: (code) => browserDirectory().resolver.resolve(code),
};

export const localOperationalWorkspaceAccessIssuer: OperationalWorkspaceAccessIssuer = {
  issue: (input) => browserDirectory().issuer.issue(input),
  listByProject: (projectId) => browserDirectory().issuer.listByProject(projectId),
  sync: (input) => browserDirectory().issuer.sync(input),
  removeUnavailable: (projectId, workspaceIds) =>
    browserDirectory().issuer.removeUnavailable(projectId, workspaceIds),
  removeProject: (projectId) => browserDirectory().issuer.removeProject(projectId),
};
