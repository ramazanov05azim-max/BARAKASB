import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalBusinessEnvironmentDirectory } from './local-business-environment-directory';

const environment = {
  businessEnvironmentId: 'environment-1',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  displayName: 'North Star',
  status: 'active' as const,
  createdAt: '2026-07-31T10:00:00.000Z',
  developmentDemo: false,
};

describe('Manager-local Business Environment directory', () => {
  beforeEach(() => window.localStorage.clear());

  it('resolves a registered environment after adapter recreation', async () => {
    await createLocalBusinessEnvironmentDirectory(window.localStorage).writer.register(
      '1234567890123456',
      environment,
    );

    expect(
      await createLocalBusinessEnvironmentDirectory(
        window.localStorage,
      ).resolver.resolve('1234 5678 9012 3456'),
    ).toEqual(environment);
  });

  it('rejects replacing an immutable project code', async () => {
    const directory = createLocalBusinessEnvironmentDirectory(window.localStorage);
    await directory.writer.register('1234567890123456', environment);

    await expect(
      directory.writer.register('9999999999999999', environment),
    ).rejects.toThrow('business-environment-code-immutable');
  });
});
