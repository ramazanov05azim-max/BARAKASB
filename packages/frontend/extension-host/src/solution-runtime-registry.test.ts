import type { SolutionRuntimeRegistration } from '@barakasb/contracts-platform';
import { describe, expect, it } from 'vitest';
import {
  DuplicateSolutionRuntimeRegistrationError,
  InMemorySolutionRuntimeRegistry,
} from './solution-runtime-registry';

const testRuntime: SolutionRuntimeRegistration = {
  manifest: {
    identity: {
      solutionKey: 'test-solution',
      runtimeVersion: '1.0.0',
    },
    displayName: 'Test Solution',
    entryRoute: '/app/runtime/test-solution',
    capabilities: ['test.read'],
  },
};

describe('InMemorySolutionRuntimeRegistry', () => {
  it('starts empty and does not contain an unknown Solution', () => {
    const registry = new InMemorySolutionRuntimeRegistry();

    expect(registry.has('unknown-solution')).toBe(false);
    expect(registry.get('unknown-solution')).toBeUndefined();
  });

  it('registers and returns a neutral test runtime', () => {
    const registry = new InMemorySolutionRuntimeRegistry();

    registry.register(testRuntime);

    expect(registry.has('test-solution')).toBe(true);
    expect(registry.get('test-solution')).toBe(testRuntime);
  });

  it('rejects duplicate registration explicitly', () => {
    const registry = new InMemorySolutionRuntimeRegistry();
    registry.register(testRuntime);

    expect(() => registry.register(testRuntime)).toThrow(
      DuplicateSolutionRuntimeRegistrationError,
    );
  });
});
