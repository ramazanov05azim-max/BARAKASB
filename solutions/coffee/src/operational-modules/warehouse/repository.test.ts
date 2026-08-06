// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WarehouseMovement } from './domain';
import { createLocalCoffeeWarehouseRepository } from './repository';

const movement: WarehouseMovement = {
  movementId: 'movement-1',
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  warehouseId: 'warehouse-1',
  resourceId: 'resource-1',
  resourceType: 'ingredient',
  movementType: 'RECEIPT',
  quantityDeltaBase: 1000,
  baseUnit: 'g',
  sourceDocumentType: 'MANUAL_RECEIPT',
  sourceDocumentId: 'receipt-1',
  occurredAt: '2026-08-06T10:00:00.000Z',
  employeeId: 'employee-1',
  workspaceId: 'workspace-1',
  comment: '',
  idempotencyKey: 'receipt-1',
};

describe('local Coffee Warehouse repository', () => {
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

  beforeEach(() => window.localStorage.clear());

  it('survives adapter recreation and keeps Project and Environment isolated', async () => {
    const first = createLocalCoffeeWarehouseRepository();
    await first.appendBatch('project-1', 'environment-1', [movement]);
    expect(
      (await createLocalCoffeeWarehouseRepository().load('project-1', 'environment-1'))
        .movements,
    ).toHaveLength(1);
    expect((await first.load('project-2', 'environment-1')).movements).toHaveLength(0);
    expect((await first.load('project-1', 'environment-2')).movements).toHaveLength(0);
  });

  it('notifies same-tab subscribers and returns immutable defensive copies', async () => {
    const repository = createLocalCoffeeWarehouseRepository();
    const listener = vi.fn();
    const unsubscribe = repository.subscribe('project-1', listener);
    await repository.appendBatch('project-1', 'environment-1', [movement]);
    expect(listener).toHaveBeenCalledOnce();
    const loaded = await repository.load('project-1', 'environment-1');
    (loaded.movements as WarehouseMovement[]).length = 0;
    expect(
      (await repository.load('project-1', 'environment-1')).movements,
    ).toHaveLength(1);
    unsubscribe();
  });

  it('does not append a duplicate idempotency key', async () => {
    const repository = createLocalCoffeeWarehouseRepository();
    await repository.appendBatch('project-1', 'environment-1', [movement]);
    await repository.appendBatch('project-1', 'environment-1', [
      { ...movement, movementId: 'movement-2' },
    ]);
    expect(
      (await repository.load('project-1', 'environment-1')).movements,
    ).toHaveLength(1);
  });
});
