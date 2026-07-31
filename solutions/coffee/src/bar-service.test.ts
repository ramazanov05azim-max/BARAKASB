import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CoffeeBarRuntimeContext,
  CoffeeBarStore,
  CoffeeOrder,
} from './bar-domain';
import type { CoffeeBarOrderRepository } from './bar-repository-contracts';
import { CoffeeBarOperationError } from './bar-repository-contracts';
import { coffeeOrderStatusRu, coffeeTableStatusRu } from './bar-ru';
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

function memoryRepository(): CoffeeBarOrderRepository & {
  value: CoffeeBarStore;
} {
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
  snapshot: CoffeeOperationalSnapshot;
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
    snapshot,
    repository,
    service: createCoffeeBarService({
      operational,
      orders: repository,
      now: () => timestamp,
      createId: () => `generated-${++sequence}`,
    }),
  };
}

async function draftWithProduct(
  service: CoffeeBarService,
  productId = 'crash-item-espresso',
): Promise<CoffeeOrder> {
  const order = await service.createTakeawayOrder(context);
  return service.addItem(context, order.orderId, { productId });
}

describe('Coffee Bar application service', () => {
  let service: CoffeeBarService;
  let repository: ReturnType<typeof memoryRepository>;
  let snapshot: CoffeeOperationalSnapshot;

  beforeEach(() => {
    ({ service, repository, snapshot } = fixture());
  });

  it('allows only an employee assigned to the generated Bar workspace', async () => {
    await expect(
      service.load({ ...context, employeeId: 'crash-employee-cashier' }),
    ).rejects.toEqual(new CoffeeBarOperationError('ACCESS_DENIED'));
  });

  it('rejects access when the Bar module was not selected', async () => {
    const next = operationalSnapshot();
    next.solutionStructure.selectedModuleIds = ['manager'];
    next.solutionStructure.workspaces = [];
    const blocked = fixture(next).service;
    await expect(blocked.load(context)).rejects.toMatchObject({
      code: 'ACCESS_DENIED',
    });
  });

  it('creates a table order only for a configured table', async () => {
    const order = await service.createTableOrder(context, 'crash-table-01');
    expect(order).toMatchObject({
      orderType: 'TABLE',
      tableId: 'crash-table-01',
      status: 'DRAFT',
      paymentStatus: 'UNPAID',
    });
  });

  it('rejects a second active order on the same table', async () => {
    await service.createTableOrder(context, 'crash-table-01');
    await expect(
      service.createTableOrder(context, 'crash-table-01'),
    ).rejects.toMatchObject({ code: 'TABLE_OCCUPIED' });
  });

  it('creates takeaway orders without a table', async () => {
    await expect(service.createTakeawayOrder(context)).resolves.toMatchObject({
      orderType: 'TAKEAWAY',
      tableId: null,
    });
  });

  it('exposes only active products and Russian categories', async () => {
    const state = await service.load(context);
    expect(
      state.products.some(
        (product) => product.id === 'crash-item-espresso-tonic-preview',
      ),
    ).toBe(false);
    expect(state.categories.map((category) => category.name)).toContain('Кофе');
  });

  it('routes products using existing preparation configuration', async () => {
    let order = await service.createTakeawayOrder(context);
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-espresso',
    });
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-sandwich',
    });
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    expect(order.items.map((item) => item.preparationWorkspace)).toEqual([
      'BAR',
      'KITCHEN',
      'IMMEDIATE',
    ]);
  });

  it('updates quantity and recalculates the order total', async () => {
    const order = await draftWithProduct(service);
    const updated = await service.updateItemQuantity(
      context,
      order.orderId,
      order.items[0]!.id,
      3,
    );
    expect(updated.total).toBe(570);
  });

  it('stores modifier and comment snapshots in the draft', async () => {
    const order = await draftWithProduct(service, 'crash-item-cappuccino');
    const updated = await service.updateItemDetails(
      context,
      order.orderId,
      order.items[0]!.id,
      {
        modifiers: [
          {
            modifierGroupId: 'crash-modifier-alternative-milk',
            optionName: 'Овсяное +70 ₽',
          },
        ],
        comment: 'Без сахара',
      },
    );
    expect(updated.items[0]).toMatchObject({
      comment: 'Без сахара',
      modifiers: [{ optionName: 'Овсяное +70 ₽', priceAdjustment: 70 }],
    });
    expect(updated.total).toBe(380);
  });

  it('removes an item only while the order is a draft', async () => {
    const order = await draftWithProduct(service);
    const updated = await service.removeItem(
      context,
      order.orderId,
      order.items[0]!.id,
    );
    expect(updated.items).toEqual([]);
  });

  it('rejects sending an empty order', async () => {
    const order = await service.createTakeawayOrder(context);
    await expect(service.sendOrder(context, order.orderId)).rejects.toMatchObject({
      code: 'ORDER_EMPTY',
    });
  });

  it('sends an order idempotently and assigns initial item states', async () => {
    let order = await service.createTakeawayOrder(context);
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-espresso',
    });
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    const sent = await service.sendOrder(context, order.orderId);
    const replay = await service.sendOrder(context, order.orderId);
    expect(sent.items.map((item) => item.status)).toEqual(['NEW', 'READY']);
    expect(replay).toEqual(sent);
    expect(
      repository.value.audit.filter((entry) => entry.operation === 'ORDER_SENT'),
    ).toHaveLength(1);
  });

  it('prevents changing order composition after sending', async () => {
    const order = await draftWithProduct(service);
    const sent = await service.sendOrder(context, order.orderId);
    await expect(
      service.updateItemQuantity(context, sent.orderId, sent.items[0]!.id, 2),
    ).rejects.toMatchObject({ code: 'ORDER_IMMUTABLE' });
  });

  it('advances Bar items through the approved state sequence', async () => {
    const draft = await draftWithProduct(service);
    let order = await service.sendOrder(context, draft.orderId);
    const itemId = order.items[0]!.id;
    order = await service.updateBarItemStatus(
      context,
      order.orderId,
      itemId,
      'ACCEPTED',
    );
    expect(order.status).toBe('IN_PREPARATION');
    order = await service.updateBarItemStatus(
      context,
      order.orderId,
      itemId,
      'PREPARING',
    );
    order = await service.updateBarItemStatus(context, order.orderId, itemId, 'READY');
    expect(order.status).toBe('READY');
  });

  it('rejects a Bar status update for a Kitchen item', async () => {
    const draft = await draftWithProduct(service, 'crash-item-sandwich');
    const order = await service.sendOrder(context, draft.orderId);
    await expect(
      service.updateBarItemStatus(
        context,
        order.orderId,
        order.items[0]!.id,
        'ACCEPTED',
      ),
    ).rejects.toMatchObject({ code: 'ITEM_ROUTE_MISMATCH' });
  });

  it('marks an all-immediate order ready when it is sent', async () => {
    const draft = await draftWithProduct(service, 'crash-item-bottled-water');
    await expect(service.sendOrder(context, draft.orderId)).resolves.toMatchObject({
      status: 'READY',
    });
  });

  it('stores an explicit local payment method without processing money', async () => {
    const draft = await draftWithProduct(service, 'crash-item-bottled-water');
    const ready = await service.sendOrder(context, draft.orderId);
    await expect(
      service.setPayment(context, ready.orderId, 'CARD'),
    ).resolves.toMatchObject({ paymentStatus: 'CARD', total: 140 });
  });

  it('requires ready and paid state before issue', async () => {
    const draft = await draftWithProduct(service, 'crash-item-bottled-water');
    const ready = await service.sendOrder(context, draft.orderId);
    await expect(service.issueOrder(context, ready.orderId)).rejects.toMatchObject({
      code: 'PAYMENT_REQUIRED',
    });
  });

  it('issues idempotently and frees the table', async () => {
    let order = await service.createTableOrder(context, 'crash-table-01');
    order = await service.addItem(context, order.orderId, {
      productId: 'crash-item-bottled-water',
    });
    order = await service.sendOrder(context, order.orderId);
    order = await service.setPayment(context, order.orderId, 'CASH');
    const issued = await service.issueOrder(context, order.orderId);
    const replay = await service.issueOrder(context, order.orderId);
    expect(replay).toEqual(issued);
    const state = await service.load(context);
    expect(state.tables.find((table) => table.id === 'crash-table-01')?.status).toBe(
      'FREE',
    );
  });

  it('cancels drafts but refuses cancellation after an item is ready', async () => {
    const draft = await draftWithProduct(service);
    await expect(service.cancelOrder(context, draft.orderId)).resolves.toMatchObject({
      status: 'CANCELLED',
    });
    const immediate = await draftWithProduct(service, 'crash-item-bottled-water');
    const ready = await service.sendOrder(context, immediate.orderId);
    await expect(service.cancelOrder(context, ready.orderId)).rejects.toMatchObject({
      code: 'INVALID_OPERATION',
    });
  });

  it('isolates orders by Business Environment', async () => {
    await draftWithProduct(service);
    const other = await service.load({
      ...context,
      businessEnvironmentId: 'environment-other',
    });
    expect(other.orders).toEqual([]);
  });

  it('does not mutate inventory while operating the Bar prototype', async () => {
    const before = structuredClone(snapshot.openingStockBalances);
    let order = await draftWithProduct(service, 'crash-item-bottled-water');
    order = await service.sendOrder(context, order.orderId);
    order = await service.setPayment(context, order.orderId, 'CASH');
    await service.issueOrder(context, order.orderId);
    expect(snapshot.openingStockBalances).toEqual(before);
  });

  it('provides Russian order and table status labels', () => {
    expect(coffeeOrderStatusRu.READY).toBe('Готов');
    expect(coffeeTableStatusRu.UNPAID).toBe('Не оплачен');
  });
});
