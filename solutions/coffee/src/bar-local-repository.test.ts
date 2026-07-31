// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CoffeeBarStore, CoffeeOrder } from './bar-domain';
import { createLocalCoffeeBarOrderRepository } from './bar-local-repository';

function order(projectId: string, orderId: string): CoffeeOrder {
  return {
    orderId,
    projectId,
    businessEnvironmentId: `environment-${projectId}`,
    workspaceId: 'workspace-bar',
    locationId: 'location-main',
    orderType: 'TAKEAWAY',
    tableId: null,
    orderNumber: 'Б-0001',
    status: 'DRAFT',
    createdAt: '2026-07-31T12:00:00.000Z',
    createdByEmployeeId: 'employee-bar',
    paymentStatus: 'UNPAID',
    total: 0,
    issuedAt: null,
    updatedAt: '2026-07-31T12:00:00.000Z',
    items: [],
  };
}

function store(projectId: string, orderId: string): CoffeeBarStore {
  return { orders: [order(projectId, orderId)], audit: [] };
}

describe('local Coffee Bar repository adapter', () => {
  const storedValues = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return storedValues.size;
    },
    clear() {
      storedValues.clear();
    },
    getItem(key) {
      return storedValues.get(key) ?? null;
    },
    key(index) {
      return [...storedValues.keys()][index] ?? null;
    },
    removeItem(key) {
      storedValues.delete(key);
    },
    setItem(key, value) {
      storedValues.set(key, value);
    },
  };

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists orders across repository recreation and browser refresh', async () => {
    const first = createLocalCoffeeBarOrderRepository(window.localStorage, window);
    await first.save('project-a', store('project-a', 'order-a'));

    const afterRefresh = createLocalCoffeeBarOrderRepository(
      window.localStorage,
      window,
    );
    await expect(afterRefresh.load('project-a')).resolves.toMatchObject({
      orders: [{ orderId: 'order-a' }],
    });
  });

  it('keeps local project data isolated', async () => {
    const repository = createLocalCoffeeBarOrderRepository(window.localStorage, window);
    await repository.save('project-a', store('project-a', 'order-a'));
    await repository.save('project-b', store('project-b', 'order-b'));

    await expect(repository.load('project-a')).resolves.toMatchObject({
      orders: [{ projectId: 'project-a' }],
    });
    await expect(repository.load('project-b')).resolves.toMatchObject({
      orders: [{ projectId: 'project-b' }],
    });
  });

  it('notifies subscribers about same-origin changes', async () => {
    const repository = createLocalCoffeeBarOrderRepository(window.localStorage, window);
    const listener = vi.fn();
    const unsubscribe = repository.subscribe('project-a', listener);

    await repository.save('project-a', store('project-a', 'order-a'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('returns defensive copies', async () => {
    const repository = createLocalCoffeeBarOrderRepository(window.localStorage, window);
    await repository.save('project-a', store('project-a', 'order-a'));
    const loaded = await repository.load('project-a');
    (loaded.orders as CoffeeOrder[])[0] = order('project-a', 'mutated');
    await expect(repository.load('project-a')).resolves.toMatchObject({
      orders: [{ orderId: 'order-a' }],
    });
  });
});
