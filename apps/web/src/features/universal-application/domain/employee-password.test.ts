import { describe, expect, it } from 'vitest';
import {
  createPasswordCredential,
  verifyPasswordCredential,
} from './employee-password';

describe('employee password credential', () => {
  it('stores a salted PBKDF2 verifier instead of the password', async () => {
    const credential = await createPasswordCredential('Coffee2026', {
      iterations: 1_000,
      salt: new Uint8Array(16).fill(7),
      now: () => '2026-08-04T10:00:00.000Z',
    });

    expect(credential).toMatchObject({
      algorithm: 'PBKDF2-SHA256',
      iterations: 1_000,
      updatedAt: '2026-08-04T10:00:00.000Z',
    });
    expect(credential.digest).not.toContain('Coffee2026');
    await expect(verifyPasswordCredential('Coffee2026', credential)).resolves.toBe(
      true,
    );
    await expect(verifyPasswordCredential('WrongPassword', credential)).resolves.toBe(
      false,
    );
  });

  it('rejects passwords shorter than four characters', async () => {
    await expect(createPasswordCredential('123')).rejects.toThrow(
      'invalid-employee-password',
    );
  });
});
