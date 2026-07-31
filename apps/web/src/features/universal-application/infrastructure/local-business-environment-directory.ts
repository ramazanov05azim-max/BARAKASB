'use client';

import type {
  BusinessEnvironmentDirectoryWriter,
  BusinessEnvironmentResolver,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';
import {
  isBusinessEnvironmentCodeComplete,
  normalizeBusinessEnvironmentCode,
} from '../domain/business-environment-code';

const directoryStorageKey = 'barakasb.local.business-environment.directory.v1';
const legacyCoffeeStorageKey = 'barakasb.local.coffee.environments.v1';

interface DirectoryEntry {
  readonly code: string;
  readonly environment: ResolvedBusinessEnvironment;
}

export interface LocalBusinessEnvironmentDirectory {
  resolver: BusinessEnvironmentResolver;
  writer: BusinessEnvironmentDirectoryWriter;
}

function isResolvedEnvironment(value: unknown): value is ResolvedBusinessEnvironment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'businessEnvironmentId' in value &&
    typeof value.businessEnvironmentId === 'string' &&
    'projectId' in value &&
    typeof value.projectId === 'string' &&
    'solutionId' in value &&
    typeof value.solutionId === 'string' &&
    'displayName' in value &&
    typeof value.displayName === 'string'
  );
}

function readEntries(storage: Storage): DirectoryEntry[] {
  const value = storage.getItem(directoryStorageKey);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is DirectoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        'code' in entry &&
        typeof entry.code === 'string' &&
        isBusinessEnvironmentCodeComplete(entry.code) &&
        'environment' in entry &&
        isResolvedEnvironment(entry.environment),
    );
  } catch {
    return [];
  }
}

function readLegacyEnvironment(
  storage: Storage,
  normalizedCode: string,
): ResolvedBusinessEnvironment | null {
  const value = storage.getItem(legacyCoffeeStorageKey);
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const record = parsed.find(
      (candidate) =>
        typeof candidate === 'object' &&
        candidate !== null &&
        'businessEnvironmentCode' in candidate &&
        candidate.businessEnvironmentCode === normalizedCode,
    );
    if (
      typeof record !== 'object' ||
      record === null ||
      !('project' in record) ||
      typeof record.project !== 'object' ||
      record.project === null ||
      !('id' in record.project) ||
      typeof record.project.id !== 'string'
    ) {
      return null;
    }
    const projectName =
      'name' in record.project && typeof record.project.name === 'string'
        ? record.project.name
        : 'Coffee';
    const createdAt =
      'createdAt' in record && typeof record.createdAt === 'string'
        ? record.createdAt
        : new Date(0).toISOString();
    return {
      businessEnvironmentId: `legacy-${record.project.id}`,
      projectId: record.project.id,
      solutionId: 'coffee',
      displayName: projectName,
      status: 'active',
      createdAt,
      developmentDemo: false,
    };
  } catch {
    return null;
  }
}

export function createLocalBusinessEnvironmentDirectory(
  storage: Storage,
): LocalBusinessEnvironmentDirectory {
  return {
    resolver: {
      async resolve(code) {
        const normalizedCode = normalizeBusinessEnvironmentCode(code);
        if (!isBusinessEnvironmentCodeComplete(normalizedCode)) return null;
        const entry = readEntries(storage).find(
          (candidate) => candidate.code === normalizedCode,
        );
        return entry
          ? structuredClone(entry.environment)
          : readLegacyEnvironment(storage, normalizedCode);
      },
    },
    writer: {
      async register(code, environment) {
        const normalizedCode = normalizeBusinessEnvironmentCode(code);
        if (!isBusinessEnvironmentCodeComplete(normalizedCode)) {
          throw new Error('invalid-business-environment-code');
        }
        const entries = readEntries(storage);
        const codeOwner = entries.find(
          (candidate) => candidate.code === normalizedCode,
        );
        if (codeOwner && codeOwner.environment.projectId !== environment.projectId) {
          throw new Error('business-environment-code-conflict');
        }
        const projectEntry = entries.find(
          (candidate) => candidate.environment.projectId === environment.projectId,
        );
        if (projectEntry && projectEntry.code !== normalizedCode) {
          throw new Error('business-environment-code-immutable');
        }
        const nextEntries = entries.filter(
          (candidate) => candidate.environment.projectId !== environment.projectId,
        );
        nextEntries.push({ code: normalizedCode, environment });
        storage.setItem(directoryStorageKey, JSON.stringify(nextEntries));
        return structuredClone(environment);
      },
      async removeProject(projectId) {
        const entries = readEntries(storage).filter(
          (candidate) => candidate.environment.projectId !== projectId,
        );
        storage.setItem(directoryStorageKey, JSON.stringify(entries));
      },
    },
  };
}

function browserDirectory(): LocalBusinessEnvironmentDirectory {
  if (typeof window === 'undefined') {
    throw new Error('local-business-environment-directory-browser-only');
  }
  return createLocalBusinessEnvironmentDirectory(window.localStorage);
}

export const localBusinessEnvironmentResolver: BusinessEnvironmentResolver = {
  resolve: (code) => browserDirectory().resolver.resolve(code),
};

export const localBusinessEnvironmentDirectoryWriter: BusinessEnvironmentDirectoryWriter =
  {
    register: (code, environment) =>
      browserDirectory().writer.register(code, environment),
    removeProject: (projectId) => browserDirectory().writer.removeProject(projectId),
  };
