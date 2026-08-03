import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CoffeeBarRuntimeContext,
  CoffeeBarStore,
  CoffeeOrder,
} from './bar-domain';
import type { CoffeeBarOrderRepository } from './bar-repository-contracts';
import { createCoffeeBarService, type CoffeeBarService } from './bar-service';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot } from './domain';
import type { CoffeeOperationalReadRepository } from './repository-contracts';

const timestamp = '2026-07-31T12:00:00.000Z';
const context: CoffeeBarRuntimeContext = {
  projectId: 'project-coffee',
  businessEnvironmentId: 'environment-coffee',
  workspaceId: 'workspace-bar',
  employeeId: 'crash-employee-barista',
};

function operationalSnapshot(): CoffeeOperationalSnapshot {
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
      brandName: 'Север Coffee Lab',
      description: '',
      logoPlaceholder: '',
      defaultCurrency: 'RUB',
      timezone: 'Europe/Moscow',
      country: 'RU',
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
      locationPolicy: 'independent',
      locale: 'ru',
      taxMode: 'standard',
      receiptFooter: '',
      enabledModules: 'bar',
      notificationMode: 'important',
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
      selectedModuleIds: ['bar'],
      workspaces: [
        {
          id: context.workspaceId,
          moduleId: 'bar',
          assignedEmployeeIds: [context.employeeId],
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

function memoryRepository(): CoffeeBarOrderRepository & { value: CoffeeBarStore } {
  return {
    value: { orders: [], audit: [] },
    async load() {
      return structuredClone(this.value);
    },
    async save(_projectId, store) {
      this.value = structuredClone(store);
    },
    subscribe() {
      return () => undefined;
    },
    async remove() {
      this.value = { orders: [], audit: [] };
    },
  };
}

function fixture(snapshot = operationalSnapshot()): {
  service: CoffeeBarService;
  repository: ReturnType<typeof memoryRepository>;
} {
  const repository = memoryRepository();
  let sequence = 0;
  const operational: CoffeeOperationalReadRepository = {
    async load(projectId) {
      if (projectId !== snapshot.project.id) throw new Error('not-found');
      return structuredClone(snapshot);
    },
  };
  return {
    repository,
    service: createCoffeeBarService({
      operational,
      orders: repository,
      now: () => timestamp,
      createId: () => `generated-${++sequence}`,
    }),
  };
}

async function tableOrder(service: CoffeeBarService): Promise<CoffeeOrder> {
  return service.createTableOrder(context, 'crash-table-01', { guestCount: 2 });
}

async function withItem(
  service: CoffeeBarService,
  productId = 'crash-item-espresso',
): Promise<CoffeeOrder> {
  const order = await tableOrder(service);
  return service.addItem(context, order.orderId, {
    productId,
    ...(productId === 'crash-item-espresso'
      ? {
          modifiers: [
            {
              modifierGroupId: 'crash-modifier-espresso-volume',
              optionName: '30 мл',
            },
          ],
        }
      : {}),
  });
}

describe('Coffee Bar application service', () => {
  let service: CoffeeBarService;
  let repository: ReturnType<typeof memoryRepository>;

  beforeEach(() => {
    ({ service, repository } = fixture());
  });

  it('authorizes only an assigned active Bar employee', async () => {
    await expect(
      service.load({ ...context, employeeId: 'crash-employee-cashier' }),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  });

  it('loads saved floor-plan zones and geometry', async () => {
    const state = await service.load(context);
    expect(state.zones.map((zone) => zone.name)).toContain('Основной зал');
    expect(state.tables[0]).toMatchObject({
      zoneId: 'crash-zone-main',
      shape: 'ROUND',
    });
  });

  it('exposes product-specific configuration and leaves simple products unconfigured', async () => {
    const state = await service.load(context);
    const groupIdsFor = (productId: string): readonly string[] =>
      state.products.find((product) => product.id === productId)?.modifierGroupIds ??
      [];

    expect(groupIdsFor('crash-item-espresso')).toEqual([
      'crash-modifier-espresso-volume',
      'crash-modifier-extra-shot',
      'crash-modifier-coffee-additional',
    ]);
    expect(groupIdsFor('crash-item-cappuccino')).toEqual([
      'crash-modifier-coffee-volume',
      'crash-modifier-milk',
      'crash-modifier-syrup',
      'crash-modifier-extra-shot',
      'crash-modifier-coffee-additional',
    ]);
    expect(groupIdsFor('crash-item-black-tea')).toEqual([
      'crash-modifier-tea-volume',
      'crash-modifier-tea-additional',
    ]);
    expect(groupIdsFor('crash-item-croissant')).toEqual([]);

    const coffeeAdditional = state.modifierGroups.find(
      (group) => group.id === 'crash-modifier-coffee-additional',
    );
    const teaAdditional = state.modifierGroups.find(
      (group) => group.id === 'crash-modifier-tea-additional',
    );
    expect(coffeeAdditional).toMatchObject({ purpose: 'additional' });
    expect(
      coffeeAdditional?.options.some((option) => option.name.startsWith('Корица')),
    ).toBe(true);
    expect(
      coffeeAdditional?.options.some((option) => option.name.startsWith('Лимон')),
    ).toBe(false);
    expect(
      teaAdditional?.options.some((option) => option.name.startsWith('Лимон')),
    ).toBe(true);
    expect(
      teaAdditional?.options.some((option) => option.name.startsWith('Корица')),
    ).toBe(false);
  });

  it('opens a free table with seating metadata', async () => {
    const order = await service.createTableOrder(context, 'crash-table-01', {
      guestCount: 1,
      note: 'У окна',
    });
    expect(order).toMatchObject({
      guestCount: 1,
      seatingNote: 'У окна',
      openedByEmployeeId: context.employeeId,
    });
  });

  it('creates an order before destination assignment', async () => {
    const order = await service.createUnassignedOrder(context);
    expect(order).toMatchObject({
      orderType: 'UNASSIGNED',
      tableId: null,
      status: 'DRAFT',
    });
    await expect(
      service.addItem(context, order.orderId, {
        productId: 'crash-item-bottled-water',
      }),
    ).resolves.toMatchObject({ total: 140 });
  });

  it('attaches an unassigned order to a free table', async () => {
    const order = await service.createUnassignedOrder(context);
    const attached = await service.assignOrder(context, order.orderId, {
      type: 'TABLE',
      tableId: 'crash-table-02',
      seating: { guestCount: 2, note: 'После выбора меню' },
    });
    expect(attached).toMatchObject({
      orderType: 'TABLE',
      tableId: 'crash-table-02',
      guestCount: 2,
      seatingNote: 'После выбора меню',
    });
    expect(repository.value.audit[0]).toMatchObject({
      operation: 'ORDER_ASSIGNED',
      detail: 'crash-table-02',
    });
  });

  it('attaches an unassigned order as takeaway', async () => {
    const order = await service.createUnassignedOrder(context);
    await expect(
      service.assignOrder(context, order.orderId, { type: 'TAKEAWAY' }),
    ).resolves.toMatchObject({ orderType: 'TAKEAWAY', tableId: null });
  });

  it('does not send an order before it is attached', async () => {
    let order = await service.createUnassignedOrder(context);
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    await expect(service.sendOrder(context, order.orderId)).rejects.toMatchObject({
      code: 'INVALID_OPERATION',
    });
  });

  it('rejects capacity overflow unless explicitly overridden', async () => {
    await expect(
      service.createTableOrder(context, 'crash-table-01', { guestCount: 20 }),
    ).rejects.toMatchObject({ code: 'CAPACITY_EXCEEDED' });
    await expect(
      service.createTableOrder(context, 'crash-table-01', {
        guestCount: 20,
        allowCapacityOverride: true,
      }),
    ).resolves.toMatchObject({ guestCount: 20 });
  });

  it('prevents two open orders on one table', async () => {
    await tableOrder(service);
    await expect(tableOrder(service)).rejects.toMatchObject({
      code: 'TABLE_OCCUPIED',
    });
  });

  it('changes guest count and records an audit entry', async () => {
    const order = await tableOrder(service);
    const updated = await service.changeGuestCount(context, order.orderId, {
      guestCount: 1,
    });
    expect(updated.guestCount).toBe(1);
    expect(repository.value.audit[0]?.operation).toBe('GUEST_COUNT_CHANGED');
  });

  it('releases only an empty unsent table order', async () => {
    const order = await tableOrder(service);
    await service.releaseTable(context, order.orderId);
    expect(repository.value.orders).toHaveLength(0);
    const filled = await withItem(service);
    await expect(service.releaseTable(context, filled.orderId)).rejects.toMatchObject({
      code: 'INVALID_OPERATION',
    });
  });

  it('transfers an order only to a free table', async () => {
    const order = await tableOrder(service);
    const moved = await service.transferOrder(context, order.orderId, 'crash-table-02');
    expect(moved.tableId).toBe('crash-table-02');
    expect(repository.value.audit[0]).toMatchObject({
      operation: 'ORDER_TRANSFERRED',
      detail: 'crash-table-01->crash-table-02',
    });
  });

  it('stores only owner-configured options and the employee comment', async () => {
    const order = await tableOrder(service);
    const updated = await service.addItem(context, order.orderId, {
      productId: 'crash-item-cappuccino',
      modifiers: [
        {
          modifierGroupId: 'crash-modifier-coffee-volume',
          optionName: '250 мл',
        },
        {
          modifierGroupId: 'crash-modifier-milk',
          optionName: 'Овсяное +70 ₽',
        },
      ],
      comment: 'Без сахара',
    });
    expect(updated.items[0]).toMatchObject({
      variantName: null,
      comment: 'Без сахара',
      finalUnitPrice: 380,
    });
    expect(
      updated.items[0]?.modifiers.map((modifier) => modifier.modifierName),
    ).toEqual(['Объём', 'Молоко']);
  });

  it('validates modifier ownership and limits', async () => {
    const order = await tableOrder(service);
    await expect(
      service.addItem(context, order.orderId, {
        productId: 'crash-item-espresso',
        modifiers: [
          {
            modifierGroupId: 'modifier-not-assigned',
            optionName: 'Овсяное +70 ₽',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_MODIFIERS' });
  });

  it('sends only the current unsent batch', async () => {
    let order = await withItem(service);
    order = await service.sendOrder(context, order.orderId);
    const firstBatch = order.batches[0]!;
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    expect(order.items.filter((item) => !item.submittedBatchId)).toHaveLength(1);
    order = await service.sendOrder(context, order.orderId);
    expect(order.batches).toHaveLength(2);
    expect(order.batches[0]).toEqual(firstBatch);
  });

  it('keeps submitted items immutable while new items remain editable', async () => {
    let order = await withItem(service);
    const submittedId = order.items[0]!.id;
    order = await service.sendOrder(context, order.orderId);
    await expect(
      service.updateItemQuantity(context, order.orderId, submittedId, 2),
    ).rejects.toMatchObject({ code: 'ORDER_IMMUTABLE' });
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    await expect(
      service.updateItemQuantity(context, order.orderId, order.items[1]!.id, 2),
    ).resolves.toMatchObject({ total: 470 });
  });

  it('preserves Bar, Kitchen and Immediate routing', async () => {
    let order = await tableOrder(service);
    for (const productId of [
      'crash-item-espresso',
      'crash-item-sandwich',
      'crash-item-bottled-water',
    ]) {
      order = await service.addItem(context, order.orderId, {
        productId,
        ...(productId === 'crash-item-espresso'
          ? {
              modifiers: [
                {
                  modifierGroupId: 'crash-modifier-espresso-volume',
                  optionName: '30 мл',
                },
              ],
            }
          : {}),
      });
    }
    expect(order.items.map((item) => item.preparationWorkspace)).toEqual([
      'BAR',
      'KITCHEN',
      'IMMEDIATE',
    ]);
  });

  it('does not allow Bar to complete Kitchen items', async () => {
    let order = await withItem(service, 'crash-item-sandwich');
    order = await service.sendOrder(context, order.orderId);
    await expect(
      service.updateBarItemStatus(
        context,
        order.orderId,
        order.items[0]!.id,
        'ACCEPTED',
      ),
    ).rejects.toMatchObject({ code: 'ITEM_ROUTE_MISMATCH' });
  });

  it('records payment separately from preparation', async () => {
    let order = await withItem(service, 'crash-item-bottled-water');
    order = await service.sendOrder(context, order.orderId);
    order = await service.recordPayment(context, order.orderId, 'CARD');
    expect(order).toMatchObject({
      status: 'READY',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paidAmount: 140,
    });
  });

  it('prevents repeated payment', async () => {
    let order = await withItem(service, 'crash-item-bottled-water');
    order = await service.sendOrder(context, order.orderId);
    order = await service.recordPayment(context, order.orderId, 'CASH');
    await expect(
      service.recordPayment(context, order.orderId, 'CARD'),
    ).rejects.toMatchObject({ code: 'PAYMENT_ALREADY_RECORDED' });
  });

  it('requires every item ready and payment before completion', async () => {
    let order = await withItem(service);
    order = await service.sendOrder(context, order.orderId);
    await expect(service.completeOrder(context, order.orderId)).rejects.toMatchObject({
      code: 'PAYMENT_REQUIRED',
    });
    order = await service.recordPayment(context, order.orderId, 'CASH');
    await expect(service.completeOrder(context, order.orderId)).rejects.toMatchObject({
      code: 'ORDER_NOT_READY',
    });
  });

  it('completes a paid ready order and releases its table', async () => {
    let order = await withItem(service, 'crash-item-bottled-water');
    order = await service.sendOrder(context, order.orderId);
    order = await service.recordPayment(context, order.orderId, 'CARD');
    order = await service.completeOrder(context, order.orderId);
    expect(order).toMatchObject({
      status: 'COMPLETED',
      completedByEmployeeId: context.employeeId,
    });
    const state = await service.load(context);
    expect(state.tables.find((table) => table.id === 'crash-table-01')?.status).toBe(
      'FREE',
    );
  });

  it('requires a reason when cancelling a sent order', async () => {
    let order = await withItem(service);
    order = await service.sendOrder(context, order.orderId);
    await expect(service.cancelOrder(context, order.orderId)).rejects.toMatchObject({
      code: 'CANCELLATION_REASON_REQUIRED',
    });
    await expect(
      service.cancelOrder(context, order.orderId, 'Гость отказался'),
    ).resolves.toMatchObject({
      status: 'CANCELLED',
      cancellationReason: 'Гость отказался',
    });
  });

  it('allows cancellation of an unsent draft without a reason', async () => {
    const order = await withItem(service);
    await expect(service.cancelOrder(context, order.orderId)).resolves.toMatchObject({
      status: 'CANCELLED',
    });
  });

  it('maps a paid ready table to waiting-for-completion status', async () => {
    let order = await withItem(service, 'crash-item-bottled-water');
    order = await service.sendOrder(context, order.orderId);
    await service.recordPayment(context, order.orderId, 'CASH');
    const state = await service.load(context);
    expect(state.tables.find((table) => table.id === order.tableId)?.status).toBe(
      'AWAITING_COMPLETION',
    );
  });
});
