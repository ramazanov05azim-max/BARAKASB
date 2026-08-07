// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupplierOrder } from './domain';
import { createLocalCoffeePurchaserRepository } from './repository';

const order: SupplierOrder = {
  orderId: 'order-1',
  orderNumber: 'ЗП-0001',
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  supplierId: 'supplier-1',
  supplierNameSnapshot: 'Поставщик',
  destinationWarehouseId: 'warehouse-1',
  destinationWarehouseNameSnapshot: 'Склад',
  status: 'DRAFT',
  createdAt: '2026-08-07T10:00:00.000Z',
  createdByEmployeeId: 'employee-1',
  workspaceId: 'workspace-1',
  expectedDeliveryAt: null,
  comment: '',
  lines: [],
  sentAt: null,
  sentByEmployeeId: null,
  cancelledAt: null,
  cancelledByEmployeeId: null,
  cancellationReason: null,
  updatedAt: '2026-08-07T10:00:00.000Z',
};

describe('local Coffee Purchaser repository', () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  });
  beforeEach(() => values.clear());

  it('survives recreation and isolates Project and Business Environment', async () => {
    const first = createLocalCoffeePurchaserRepository();
    await first.saveOrder('project-1', 'environment-1', order);
    expect(
      (await createLocalCoffeePurchaserRepository().load('project-1', 'environment-1'))
        .orders,
    ).toHaveLength(1);
    expect((await first.load('project-2', 'environment-1')).orders).toHaveLength(0);
    expect((await first.load('project-1', 'environment-2')).orders).toHaveLength(0);
  });

  it('returns defensive copies and synchronizes the current tab', async () => {
    const repository = createLocalCoffeePurchaserRepository();
    const listener = vi.fn();
    const unsubscribe = repository.subscribe('project-1', listener);
    await repository.saveOrder('project-1', 'environment-1', order);
    expect(listener).toHaveBeenCalledOnce();
    const loaded = await repository.load('project-1', 'environment-1');
    (loaded.orders as SupplierOrder[]).length = 0;
    expect((await repository.load('project-1', 'environment-1')).orders).toHaveLength(
      1,
    );
    unsubscribe();
  });
});
