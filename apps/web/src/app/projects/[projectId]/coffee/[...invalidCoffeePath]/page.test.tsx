import { afterEach, describe, expect, it, vi } from 'vitest';
import InvalidCoffeeRoutePage, { resolveRemovedCoffeeHubRedirect } from './page';

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock('next/navigation', () => ({
  redirect,
}));

describe('removed Coffee hub routes', () => {
  afterEach(() => redirect.mockClear());

  it.each([
    ['menu', '/projects/project-1/coffee/menu/categories'],
    ['inventory', '/projects/project-1/coffee/inventory/ingredients'],
  ])('redirects /%s to its first working page', async (segment, destination) => {
    await expect(
      InvalidCoffeeRoutePage({
        params: Promise.resolve({
          projectId: 'project-1',
          invalidCoffeePath: [segment],
        }),
      }),
    ).rejects.toThrow(`redirect:${destination}`);
    expect(redirect).toHaveBeenCalledWith(destination);
  });

  it('does not redirect unrelated invalid Coffee paths', () => {
    expect(resolveRemovedCoffeeHubRedirect('project-1', ['unknown'])).toBeNull();
    expect(
      resolveRemovedCoffeeHubRedirect('project-1', ['unknown', 'nested']),
    ).toBeNull();
  });
});
