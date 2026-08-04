import { afterEach, describe, expect, it, vi } from 'vitest';
import CoffeeCrashTestBootstrapPage, { isCoffeeCrashTestRouteEnabled } from './page';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound,
}));

describe('/projects/dev/coffee-crash-test', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    notFound.mockClear();
  });

  it('is available in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(isCoffeeCrashTestRouteEnabled(process.env.NODE_ENV)).toBe(true);
    expect(() => CoffeeCrashTestBootstrapPage()).not.toThrow();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('remains unavailable in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(isCoffeeCrashTestRouteEnabled(process.env.NODE_ENV)).toBe(false);
    expect(() => CoffeeCrashTestBootstrapPage()).toThrow('not-found');
    expect(notFound).toHaveBeenCalledOnce();
  });
});
