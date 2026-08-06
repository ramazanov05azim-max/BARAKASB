import { describe, expect, it } from 'vitest';
import { operationalPlatformServiceKeys } from '../src/operational-module';

describe('operational module platform contracts', () => {
  it('exposes one stable key for every approved shared platform service', () => {
    expect(operationalPlatformServiceKeys).toEqual([
      'employee-session',
      'authorization',
      'media',
      'notifications',
      'printing',
      'audit',
      'synchronization',
    ]);
    expect(new Set(operationalPlatformServiceKeys).size).toBe(
      operationalPlatformServiceKeys.length,
    );
  });
});
