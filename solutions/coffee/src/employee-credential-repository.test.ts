// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import type { CoffeeEmployeePasswordCredential } from './domain';
import {
  createCoffeeEmployeeCredentialRepository,
  type CredentialStoragePort,
} from './employee-credential-repository';

const credential: CoffeeEmployeePasswordCredential = {
  algorithm: 'PBKDF2-SHA256',
  salt: '01020304',
  iterations: 120_000,
  digest: 'abcdef',
  updatedAt: '2026-08-04T10:00:00.000Z',
};

function storage(): CredentialStoragePort {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe('Coffee employee credential repository', () => {
  it('keeps credentials isolated by Project and employee', async () => {
    const repository = createCoffeeEmployeeCredentialRepository(storage());
    await repository.set('project-a', 'employee-1', credential);

    await expect(repository.get('project-a', 'employee-1')).resolves.toEqual(
      credential,
    );
    await expect(repository.get('project-a', 'employee-2')).resolves.toBeNull();
    await expect(repository.get('project-b', 'employee-1')).resolves.toBeNull();
  });

  it('replaces and removes a verifier without storing a password field', async () => {
    const credentialStorage = storage();
    const repository = createCoffeeEmployeeCredentialRepository(credentialStorage);
    await repository.set('project-a', 'employee-1', credential);
    await repository.set('project-a', 'employee-1', {
      ...credential,
      digest: 'new-digest',
    });

    await expect(repository.get('project-a', 'employee-1')).resolves.toMatchObject({
      digest: 'new-digest',
    });
    expect(
      credentialStorage.getItem(
        'barakasb.mock.coffee.employee-credentials.v1.project-a',
      ),
    ).not.toContain('"password"');

    await repository.remove('project-a', 'employee-1');
    await expect(repository.get('project-a', 'employee-1')).resolves.toBeNull();
  });
});
