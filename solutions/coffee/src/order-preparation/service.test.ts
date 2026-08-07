import { describe, expect, it, vi } from 'vitest';
import type { CoffeeBarStore, CoffeeOrder, CoffeeOrderItem } from '../bar-domain';
import type { CoffeeBarOrderRepository } from '../bar-repository-contracts';
import { createCoffeeBarService } from '../bar-service';
import { createCoffeeCrashTestSeed } from '../coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot } from '../domain';
import type { CoffeeOperationalReadRepository } from '../repository-contracts';
import type { PreparationRuntimeContext } from './contracts';
import { createCoffeePreparationService } from './service';

const timestamp = '2026-08-07T10:00:00.000Z';
const context: PreparationRuntimeContext = {
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  workspaceId: 'workspace-kitchen',
  employeeId: 'crash-employee-kitchen',
};

function snapshot(): CoffeeOperationalSnapshot {
  const seed = createCoffeeCrashTestSeed(timestamp);
  return {
    project: {
      id: context.projectId,
      name: seed.projectDisplayName,
      solutionStatus: 'configured',
      defaultLocationId: 'crash-location-main',
      ready: true,
      updatedAt: timestamp,
    },
    businessProfile: {
      businessName: seed.projectDisplayName,
      legalName: '',
      brandName: '',
      description: '',
      logoPlaceholder: '',
      defaultCurrency: 'RUB',
      timezone: 'Europe/Moscow',
      country: 'Россия',
      language: 'ru',
      taxMode: 'standard',
      receiptInformation: '',
      contactInformation: '',
      businessAddress: '',
      updatedAt: timestamp,
    },
    settings: {
      businessDayBoundary: '04:00',
      brandAccent: 'blue',
      locationPolicy: 'project',
      locale: 'ru',
      taxMode: 'standard',
      receiptFooter: '',
      enabledModules: 'bar,kitchen',
      notificationMode: 'in-app',
      updatedAt: timestamp,
    },
    locations: seed.locations,
    floorPlanZones: seed.floorPlanZones,
    tables: seed.tables,
    warehouses: seed.warehouses,
    units: seed.units,
    ingredients: seed.ingredients,
    menuItems: seed.menuItems,
    menuCategories: seed.menuCategories,
    modifiers: seed.modifiers,
    recipes: seed.recipes,
    openingStockBalances: seed.openingStockBalances,
    suppliers: seed.suppliers,
    employees: seed.employees,
    solutionStructure: {
      selectedModuleIds: ['bar', 'kitchen'],
      workspaces: [
        {
          id: 'workspace-bar',
          moduleId: 'bar',
          assignedEmployeeIds: ['crash-employee-barista'],
          sourceWarehouseId: 'crash-warehouse-bar',
          locationId: 'crash-location-main',
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: context.workspaceId,
          moduleId: 'kitchen',
          assignedEmployeeIds: [context.employeeId],
          sourceWarehouseId: 'crash-warehouse-kitchen',
          locationId: 'crash-location-production',
          preparationTiming: { delayedMinutes: 10, criticalMinutes: 20 },
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      generatedAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

function item(
  id: string,
  route: CoffeeOrderItem['preparationWorkspace'],
  status: CoffeeOrderItem['status'] = 'NEW',
): CoffeeOrderItem {
  return {
    id,
    productId: route === 'KITCHEN' ? 'crash-item-sandwich' : 'crash-item-espresso',
    productName: route === 'KITCHEN' ? 'Сэндвич' : 'Эспрессо',
    variantName: null,
    quantity: 1,
    unitPrice: 100,
    finalUnitPrice: 100,
    modifiers:
      route === 'KITCHEN'
        ? [
            {
              modifierGroupId: 'group-1',
              modifierName: 'Состав',
              optionName: 'Без томата',
              priceAdjustment: 0,
            },
          ]
        : [],
    comment: route === 'KITCHEN' ? 'Без перца' : '',
    preparationWorkspace: route,
    status,
    submittedBatchId: 'batch-1',
    preparationStartedAt: status === 'PREPARING' ? timestamp : null,
    preparationStartedByEmployeeId: status === 'PREPARING' ? context.employeeId : null,
    readyAt: status === 'READY' ? timestamp : null,
    readyByEmployeeId: status === 'READY' ? context.employeeId : null,
    issuedAt: null,
    issuedByEmployeeId: null,
  };
}

function order(input?: Partial<CoffeeOrder>): CoffeeOrder {
  return {
    orderId: 'order-1',
    projectId: context.projectId,
    businessEnvironmentId: context.businessEnvironmentId,
    workspaceId: 'workspace-bar',
    locationId: 'crash-location-main',
    orderType: 'TABLE',
    tableId: 'crash-table-01',
    orderNumber: 'Б-0001',
    status: 'SENT',
    guestCount: 2,
    seatingNote: '',
    openedAt: timestamp,
    openedByEmployeeId: 'crash-employee-barista',
    createdAt: timestamp,
    createdByEmployeeId: 'crash-employee-barista',
    paymentStatus: 'UNPAID',
    paymentMethod: null,
    paidAmount: null,
    paidAt: null,
    paidByEmployeeId: null,
    total: 200,
    issuedAt: null,
    completedAt: null,
    completedByEmployeeId: null,
    cancellationReason: null,
    updatedAt: timestamp,
    items: [item('kitchen-1', 'KITCHEN'), item('bar-1', 'BAR')],
    batches: [
      {
        batchId: 'batch-1',
        orderId: 'order-1',
        createdAt: timestamp,
        createdByEmployeeId: 'crash-employee-barista',
        itemIds: ['kitchen-1', 'bar-1'],
        sentAt: timestamp,
        status: 'SENT',
      },
    ],
    ...input,
  };
}

class MemoryOrders implements CoffeeBarOrderRepository {
  listeners = new Set<() => void>();
  saves = 0;
  constructor(public store: CoffeeBarStore) {}
  async load() {
    return structuredClone(this.store);
  }
  async save(_projectId: string, store: CoffeeBarStore) {
    this.saves += 1;
    this.store = structuredClone(store);
    this.listeners.forEach((listener) => listener());
  }
  subscribe(_projectId: string, listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  async remove() {
    this.store = { orders: [], audit: [] };
  }
}

function harness(orders = [order()]) {
  const repository = new MemoryOrders({ orders, audit: [] });
  const operational: CoffeeOperationalReadRepository = {
    load: async () => structuredClone(snapshot()),
  };
  return {
    repository,
    service: createCoffeePreparationService({
      operational,
      orders: repository,
      now: () => timestamp,
      createId: () => `audit-${repository.saves + 1}`,
    }),
  };
}

describe('owner-owned Preparation service', () => {
  it('projects only Kitchen-routed, sent, non-cancelled positions oldest first', async () => {
    const older = order({ orderId: 'older', orderNumber: 'Б-0001' });
    const newer = order({
      orderId: 'newer',
      orderNumber: 'Б-0002',
      updatedAt: '2026-08-07T10:05:00.000Z',
      batches: [
        {
          ...order().batches[0]!,
          orderId: 'newer',
          sentAt: '2026-08-07T10:05:00.000Z',
        },
      ],
      items: [
        item('kitchen-newer', 'KITCHEN'),
        item('bar-newer', 'BAR'),
        item('immediate-newer', 'IMMEDIATE', 'READY'),
        item('cancelled-newer', 'KITCHEN', 'CANCELLED'),
      ],
    });
    const { service } = harness([newer, older]);
    const queue = await service.loadKitchenQueue(context);

    expect(queue.tickets.map((ticket) => ticket.orderId)).toEqual(['older', 'newer']);
    expect(queue.tickets[1]?.positions.map((position) => position.orderItemId)).toEqual(
      ['kitchen-newer'],
    );
    expect(queue.sourceWarehouseName).toBe('Кухонный запас');
  });

  it('applies the exact New to Preparing to Ready lifecycle and notifies subscribers', async () => {
    const { service, repository } = harness();
    const listener = vi.fn();
    service.subscribe(context, listener);

    await service.acceptPosition(context, 'order-1', 'kitchen-1');
    expect(repository.store.orders[0]?.items[0]).toMatchObject({
      status: 'PREPARING',
      preparationStartedByEmployeeId: context.employeeId,
    });
    expect(repository.store.orders[0]?.status).toBe('IN_PREPARATION');

    await service.markPositionReady(context, 'order-1', 'kitchen-1');
    expect(repository.store.orders[0]?.items[0]).toMatchObject({
      status: 'READY',
      readyByEmployeeId: context.employeeId,
    });
    expect(repository.store.orders[0]?.status).toBe('SENT');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(repository.store.audit.map((entry) => entry.operation)).toEqual([
      'READY_POSITION',
      'ACCEPT_POSITION',
    ]);
  });

  it('accepts all new Kitchen positions in one save and keeps Bar and ready positions unchanged', async () => {
    const mixed = order({
      items: [
        item('new-1', 'KITCHEN'),
        item('new-2', 'KITCHEN'),
        item('ready-1', 'KITCHEN', 'READY'),
        item('bar-1', 'BAR'),
      ],
    });
    const { service, repository } = harness([mixed]);
    await service.acceptAll(context, mixed.orderId);
    expect(repository.saves).toBe(1);
    expect(repository.store.orders[0]?.items.map((entry) => entry.status)).toEqual([
      'PREPARING',
      'PREPARING',
      'READY',
      'NEW',
    ]);
    await service.acceptAll(context, mixed.orderId);
    expect(repository.saves).toBe(1);
  });

  it('confirms all ready idempotently without completing the customer order', async () => {
    const mixed = order({
      items: [item('kitchen-1', 'KITCHEN', 'READY'), item('bar-1', 'BAR', 'NEW')],
    });
    const { service, repository } = harness([mixed]);
    await service.confirmAllReady(context, mixed.orderId);
    await service.confirmAllReady(context, mixed.orderId);
    expect(repository.saves).toBe(1);
    expect(repository.store.orders[0]?.status).toBe('SENT');
    expect(repository.store.orders[0]?.items[1]?.status).toBe('NEW');
    expect(repository.store.audit).toHaveLength(1);
    expect(repository.store.audit[0]?.operation).toBe('READY_ALL');
  });

  it('updates the same authoritative order observed by Bar and blocks mixed-order issue until Bar is ready', async () => {
    const { service, repository } = harness();
    const operational: CoffeeOperationalReadRepository = {
      load: async () => structuredClone(snapshot()),
    };
    const bar = createCoffeeBarService({
      operational,
      orders: repository,
      now: () => timestamp,
    });
    const barContext = {
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      workspaceId: 'workspace-bar',
      employeeId: 'crash-employee-barista',
    };

    await service.acceptPosition(context, 'order-1', 'kitchen-1');
    await service.markPositionReady(context, 'order-1', 'kitchen-1');
    const barState = await bar.load(barContext);
    expect(barState.orders[0]?.items[0]?.status).toBe('READY');
    await expect(bar.issueReadyOrder(barContext, 'order-1')).rejects.toMatchObject({
      code: 'ORDER_NOT_READY',
    });

    await bar.updateBarItemStatus(barContext, 'order-1', 'bar-1', 'PREPARING');
    await bar.updateBarItemStatus(barContext, 'order-1', 'bar-1', 'READY');
    await expect(bar.issueReadyOrder(barContext, 'order-1')).resolves.toMatchObject({
      status: 'READY',
    });
  });

  it('rejects owner-preview writes but keeps queue readable', async () => {
    const { service } = harness();
    const preview = { ...context, employeeId: 'owner-preview' };
    await expect(service.loadKitchenQueue(preview)).resolves.toBeTruthy();
    await expect(
      service.acceptPosition(preview, 'order-1', 'kitchen-1'),
    ).rejects.toMatchObject({ code: 'READ_ONLY_PREVIEW' });
  });
});
