'use client';

import type { CoffeeEmployeeCredentialRecord } from './domain';
import type { CoffeeEmployeeCredentialRepository } from './repository-contracts';

export const coffeeEmployeeCredentialStoragePrefix =
  'barakasb.mock.coffee.employee-credentials.v1';

export interface CredentialStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storageKey(projectId: string): string {
  return `${coffeeEmployeeCredentialStoragePrefix}.${encodeURIComponent(projectId)}`;
}

function isCredentialRecord(value: unknown): value is CoffeeEmployeeCredentialRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('employeeId' in value) ||
    typeof value.employeeId !== 'string' ||
    !('credential' in value) ||
    typeof value.credential !== 'object' ||
    value.credential === null
  ) {
    return false;
  }
  const credential = value.credential;
  return (
    'algorithm' in credential &&
    credential.algorithm === 'PBKDF2-SHA256' &&
    'salt' in credential &&
    typeof credential.salt === 'string' &&
    'iterations' in credential &&
    typeof credential.iterations === 'number' &&
    Number.isSafeInteger(credential.iterations) &&
    credential.iterations > 0 &&
    'digest' in credential &&
    typeof credential.digest === 'string' &&
    'updatedAt' in credential &&
    typeof credential.updatedAt === 'string'
  );
}

function read(
  storage: CredentialStoragePort,
  projectId: string,
): CoffeeEmployeeCredentialRecord[] {
  const stored = storage.getItem(storageKey(projectId));
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isCredentialRecord).map((record) => structuredClone(record))
      : [];
  } catch {
    return [];
  }
}

function write(
  storage: CredentialStoragePort,
  projectId: string,
  records: ReadonlyArray<CoffeeEmployeeCredentialRecord>,
): void {
  storage.setItem(storageKey(projectId), JSON.stringify(records));
}

export function createCoffeeEmployeeCredentialRepository(
  storage: CredentialStoragePort,
): CoffeeEmployeeCredentialRepository {
  return {
    async get(projectId, employeeId) {
      const record = read(storage, projectId).find(
        (candidate) => candidate.employeeId === employeeId,
      );
      return record ? structuredClone(record.credential) : null;
    },
    async set(projectId, employeeId, credential) {
      const records = read(storage, projectId);
      const next: CoffeeEmployeeCredentialRecord = {
        employeeId,
        credential: structuredClone(credential),
      };
      const index = records.findIndex(
        (candidate) => candidate.employeeId === employeeId,
      );
      if (index >= 0) records[index] = next;
      else records.push(next);
      write(storage, projectId, records);
    },
    async remove(projectId, employeeId) {
      write(
        storage,
        projectId,
        read(storage, projectId).filter(
          (candidate) => candidate.employeeId !== employeeId,
        ),
      );
    },
    async removeProject(projectId) {
      storage.removeItem(storageKey(projectId));
    },
  };
}

function browserRepository(): CoffeeEmployeeCredentialRepository {
  if (typeof window === 'undefined') {
    throw new Error('coffee-employee-credential-repository-browser-only');
  }
  return createCoffeeEmployeeCredentialRepository(window.localStorage);
}

export const localCoffeeEmployeeCredentialRepository: CoffeeEmployeeCredentialRepository =
  {
    get: (projectId, employeeId) => browserRepository().get(projectId, employeeId),
    set: (projectId, employeeId, credential) =>
      browserRepository().set(projectId, employeeId, credential),
    remove: (projectId, employeeId) =>
      browserRepository().remove(projectId, employeeId),
    removeProject: (projectId) => browserRepository().removeProject(projectId),
  };
