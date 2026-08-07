import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createCoffeeCrashTestSeed } from '../../coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot, Supplier } from '../../domain';
import type {
  CoffeeOperationalReadRepository,
  CollectionRepository,
} from '../../repository-contracts';
import type {
  WarehouseOperationsQueryService,
  WarehouseOperationsReadModel,
} from '../warehouse/queries';
import type { WarehouseSupplyReceiptService } from '../warehouse/supply';
import type {
  PurchaseDelivery,
  PurchasePriceHistoryEntry,
  PurchaserConfigurationWarning,
  PurchaserStore,
  SupplierAssortment,
  SupplierOrder,
} from './domain';
import type { CoffeePurchaserRepository } from './repository';
import { createCoffeePurchaserService } from './service';

const timestamp = '2026-08-07T10:00:00.000Z';
const context = {
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  workspaceId: 'workspace-purchasing',
  employeeId: 'crash-employee-warehouse',
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
      enabledModules: 'purchasing',
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
    openingStockBalances: [],
    suppliers: seed.suppliers,
    employees: seed.employees,
    solutionStructure: {
      selectedModuleIds: ['purchasing'],
      workspaces: [
        {
          id: context.workspaceId,
          moduleId: 'purchasing',
          assignedEmployeeIds: [context.employeeId],
          assignedWarehouseIds: ['crash-warehouse-main'],
          sourceWarehouseId: null,
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

function warehouseState(
  minimum: number | null = 1000,
  balance = 200,
): WarehouseOperationsReadModel {
  const resource = {
    resourceId: 'crash-ingredient-espresso-beans',
    resourceType: 'ingredient' as const,
    name: 'Зерно для эспрессо',
    accountingType: 'weight' as const,
    baseUnit: 'g' as const,
    baseUnitId: 'unit-g',
    purchaseUnitId: 'unit-kg',
    purchasePackageSize: 1000,
    minimumStockBase: minimum,
    active: true,
  };
  return {
    warehouses: [{ id: 'crash-warehouse-main', name: 'Главный склад' }],
    resources: [resource],
    balances: [
      {
        warehouseId: 'crash-warehouse-main',
        warehouseName: 'Главный склад',
        resourceId: resource.resourceId,
        resourceName: resource.name,
        resourceType: resource.resourceType,
        accountingType: resource.accountingType,
        quantityBase: balance,
        baseUnit: resource.baseUnit,
        baseUnitId: resource.baseUnitId,
        purchaseUnitId: resource.purchaseUnitId,
        purchasePackageSize: resource.purchasePackageSize,
        minimumStockBase: resource.minimumStockBase,
        status: balance < 0 ? 'NEGATIVE' : balance === 0 ? 'OUT_OF_STOCK' : 'LOW',
      },
    ],
    recentMovements: [],
    issues: [],
  };
}

class MemoryPurchaserRepository implements CoffeePurchaserRepository {
  store: PurchaserStore = {
    schemaVersion: 1,
    assortments: [],
    orders: [],
    deliveries: [],
    priceHistory: [],
    warnings: [],
  };
  async load() {
    return structuredClone(this.store);
  }
  async saveAssortment(
    _project: string,
    _environment: string,
    value: SupplierAssortment,
  ) {
    this.store = {
      ...this.store,
      assortments: this.store.assortments.some(
        (item) => item.assortmentId === value.assortmentId,
      )
        ? this.store.assortments.map((item) =>
            item.assortmentId === value.assortmentId ? value : item,
          )
        : [...this.store.assortments, value],
    };
    return this.load();
  }
  async removeAssortment(_project: string, _environment: string, assortmentId: string) {
    this.store = {
      ...this.store,
      assortments: this.store.assortments.filter(
        (item) => item.assortmentId !== assortmentId,
      ),
    };
    return this.load();
  }
  async saveOrder(_project: string, _environment: string, value: SupplierOrder) {
    this.store = {
      ...this.store,
      orders: this.store.orders.some((item) => item.orderId === value.orderId)
        ? this.store.orders.map((item) =>
            item.orderId === value.orderId ? value : item,
          )
        : [...this.store.orders, value],
    };
    return this.load();
  }
  async saveDelivery(_project: string, _environment: string, value: PurchaseDelivery) {
    const existing = this.store.deliveries.find(
      (item) => item.deliveryId === value.deliveryId,
    );
    if (existing?.status === 'POSTED') throw new Error('delivery-immutable');
    this.store = {
      ...this.store,
      deliveries: existing
        ? this.store.deliveries.map((item) =>
            item.deliveryId === value.deliveryId ? value : item,
          )
        : [...this.store.deliveries, value],
    };
    return this.load();
  }
  async commitPostedDelivery(
    _project: string,
    _environment: string,
    input: {
      delivery: PurchaseDelivery;
      order: SupplierOrder;
      priceEntries: ReadonlyArray<PurchasePriceHistoryEntry>;
      assortmentUpdates: ReadonlyArray<SupplierAssortment>;
    },
  ) {
    if (
      this.store.deliveries.some(
        (item) =>
          item.deliveryId === input.delivery.deliveryId && item.status === 'POSTED',
      )
    )
      throw new Error('duplicate-delivery');
    this.store = {
      ...this.store,
      deliveries: this.store.deliveries.map((item) =>
        item.deliveryId === input.delivery.deliveryId ? input.delivery : item,
      ),
      orders: this.store.orders.map((item) =>
        item.orderId === input.order.orderId ? input.order : item,
      ),
      priceHistory: [...this.store.priceHistory, ...input.priceEntries],
      assortments: input.assortmentUpdates.reduce(
        (items, update) =>
          items.some((item) => item.assortmentId === update.assortmentId)
            ? items.map((item) =>
                item.assortmentId === update.assortmentId ? update : item,
              )
            : [...items, update],
        [...this.store.assortments],
      ),
    };
    return this.load();
  }
  async saveWarnings(
    _project: string,
    _environment: string,
    values: ReadonlyArray<PurchaserConfigurationWarning>,
  ) {
    this.store = { ...this.store, warnings: [...values] };
    return this.load();
  }
  subscribe() {
    return () => undefined;
  }
}

function supplierRepository(
  value: CoffeeOperationalSnapshot,
): CollectionRepository<Supplier> {
  let supplierValues = [...value.suppliers];
  return {
    list: async () => structuredClone(supplierValues),
    create: async (_project, input) => {
      const created = { ...input, id: 'supplier-created', updatedAt: timestamp };
      supplierValues.push(created);
      return structuredClone(created);
    },
    update: async (_project, id, input) => {
      const existing = supplierValues.find((supplier) => supplier.id === id)!;
      Object.assign(existing, input, { updatedAt: timestamp });
      return structuredClone(existing);
    },
    remove: async (_project, id) => {
      supplierValues = supplierValues.filter((supplier) => supplier.id !== id);
    },
  };
}

const orderInput = {
  supplierId: 'crash-supplier-beans',
  destinationWarehouseId: 'crash-warehouse-main',
  lines: [
    {
      resourceId: 'crash-ingredient-espresso-beans',
      quantityPurchaseUnit: 10,
      expectedUnitPrice: 1200,
    },
  ],
};

describe('CoffeePurchaserService', () => {
  let value: CoffeeOperationalSnapshot;
  let repository: MemoryPurchaserRepository;
  let currentWarehouseState: WarehouseOperationsReadModel;
  let recordSupplierDelivery: Mock<
    WarehouseSupplyReceiptService['recordSupplierDelivery']
  >;
  let service: ReturnType<typeof createCoffeePurchaserService>;

  beforeEach(() => {
    value = snapshot();
    repository = new MemoryPurchaserRepository();
    currentWarehouseState = warehouseState();
    recordSupplierDelivery = vi.fn(async () => undefined);
    const operational: CoffeeOperationalReadRepository = {
      load: async (projectId) => {
        if (projectId !== value.project.id) throw new Error('not-found');
        return structuredClone(value);
      },
    };
    service = createCoffeePurchaserService({
      operational,
      purchaser: repository,
      warehouse: {
        queryOperations: async () => structuredClone(currentWarehouseState),
        subscribe: () => () => undefined,
        recordSupplierDelivery: async (runtime, input) => {
          await recordSupplierDelivery(runtime, input);
        },
      } satisfies WarehouseOperationsQueryService & WarehouseSupplyReceiptService,
      suppliers: supplierRepository(value),
      now: () => timestamp,
      createId: (() => {
        let index = 0;
        return () => `generated-${++index}`;
      })(),
    });
  });

  it('derives need from Warehouse balance and an explicit threshold', async () => {
    const state = await service.load(context);
    const need = state.needs.find(
      (item) => item.resource.resourceId === 'crash-ingredient-espresso-beans',
    );
    expect(need?.balance.quantityBase).toBe(200);
    expect(need?.recommendedQuantityBase).toBe(800);
    expect(need?.preferredSupplier?.name).toBe('Северное зерно');
  });

  it('publishes owner-calculated need facts through the minimal operations query', async () => {
    const result = await service.queryOperations(context);
    expect(result.needs[0]).toMatchObject({
      resourceName: 'Зерно для эспрессо',
      quantityBase: 200,
      thresholdBase: 1000,
      recommendedQuantityBase: 800,
      preferredSupplierName: 'Северное зерно',
      hasOpenOrder: false,
    });
    expect(result).not.toHaveProperty('assortments');
    expect(result).not.toHaveProperty('priceHistory');
  });

  it('does not invent a recommendation without a threshold and exposes negative stock', async () => {
    currentWarehouseState = warehouseState(null, -250);
    const need = (await service.load(context)).needs[0]!;
    expect(need.recommendedQuantityBase).toBeNull();
    expect(need.state).toBe('NEGATIVE');
  });

  it('creates and edits a multi-line draft with frozen package and price snapshots', async () => {
    currentWarehouseState = {
      ...currentWarehouseState,
      resources: [
        ...currentWarehouseState.resources,
        {
          ...currentWarehouseState.resources[0]!,
          resourceId: 'resource-package',
          resourceType: 'package',
          name: 'Стакан',
          baseUnit: 'pc',
          accountingType: 'pieces',
          purchasePackageSize: 50,
        },
      ],
    };
    const draft = await service.createOrder(context, {
      ...orderInput,
      lines: [
        ...orderInput.lines,
        {
          resourceId: 'resource-package',
          quantityPurchaseUnit: 2,
          expectedUnitPrice: 300,
        },
      ],
    });
    expect(draft.lines).toHaveLength(2);
    expect(draft.lines[0]).toMatchObject({
      orderedQuantityBase: 10000,
      expectedLineTotal: 12000,
      packageSizeSnapshot: 1000,
    });
    currentWarehouseState = {
      ...currentWarehouseState,
      resources: currentWarehouseState.resources.map((resource, index) =>
        index === 0
          ? { ...resource, name: 'Новое имя', purchasePackageSize: 500 }
          : resource,
      ),
    };
    expect(repository.store.orders[0]?.lines[0]?.resourceNameSnapshot).toBe(
      'Зерно для эспрессо',
    );
  });

  it('sends a draft and requires a reason for cancellation', async () => {
    const draft = await service.createOrder(context, {
      ...orderInput,
      expectedDeliveryAt: '2026-08-01',
    });
    const sent = await service.sendOrder(context, draft.orderId);
    expect(sent.status).toBe('SENT');
    expect((await service.queryOperations(context)).orders[0]?.isOverdue).toBe(true);
    await expect(service.cancelOrder(context, sent.orderId, '')).rejects.toThrow(
      'cancellation-reason-required',
    );
    expect(
      (await service.cancelOrder(context, sent.orderId, 'Не актуально')).status,
    ).toBe('CANCELLED');
  });

  it('posts a partial delivery, preserves actual price and writes Warehouse once', async () => {
    const draft = await service.createOrder(context, orderInput);
    await service.sendOrder(context, draft.orderId);
    const delivery = await service.createDeliveryDraft(context, draft.orderId);
    await service.postDelivery(context, delivery.deliveryId, {
      supplierDocumentReference: 'УПД-77',
      deliveredAt: '2026-08-07',
      lines: [
        {
          orderLineId: draft.lines[0]!.lineId,
          quantityPurchaseUnit: 6,
          actualUnitPrice: 1250,
        },
      ],
    });
    expect(repository.store.orders[0]?.status).toBe('PARTIALLY_DELIVERED');
    expect(repository.store.priceHistory[0]).toMatchObject({
      actualUnitPrice: 1250,
      baseUnitPrice: 1.25,
    });
    expect((await service.queryOperations(context)).deliveries[0]).toMatchObject({
      actualPriceHigher: true,
      overdelivery: false,
    });
    expect(recordSupplierDelivery).toHaveBeenCalledOnce();
    expect(recordSupplierDelivery.mock.calls[0]?.[1].lines[0]?.quantityBase).toBe(6000);
    await expect(
      service.cancelOrder(context, draft.orderId, 'Поставщик не довезёт остаток'),
    ).rejects.toThrow('order-immutable');
  });

  it('allows a second delivery to complete the order', async () => {
    const order = await service.createOrder(context, orderInput);
    await service.sendOrder(context, order.orderId);
    const first = await service.createDeliveryDraft(context, order.orderId);
    await service.postDelivery(context, first.deliveryId, {
      supplierDocumentReference: 'УПД-1',
      deliveredAt: '2026-08-07',
      lines: [
        {
          orderLineId: order.lines[0]!.lineId,
          quantityPurchaseUnit: 6,
          actualUnitPrice: 1200,
        },
      ],
    });
    const second = await service.createDeliveryDraft(context, order.orderId);
    await service.postDelivery(context, second.deliveryId, {
      supplierDocumentReference: 'УПД-2',
      deliveredAt: '2026-08-08',
      lines: [
        {
          orderLineId: order.lines[0]!.lineId,
          quantityPurchaseUnit: 4,
          actualUnitPrice: 1210,
        },
      ],
    });
    expect(repository.store.orders[0]?.status).toBe('DELIVERED');
    expect(recordSupplierDelivery).toHaveBeenCalledTimes(2);
  });

  it('requires explicit overdelivery confirmation', async () => {
    const order = await service.createOrder(context, orderInput);
    await service.sendOrder(context, order.orderId);
    const delivery = await service.createDeliveryDraft(context, order.orderId);
    const posting = {
      supplierDocumentReference: 'УПД-3',
      deliveredAt: '2026-08-07',
      lines: [
        {
          orderLineId: order.lines[0]!.lineId,
          quantityPurchaseUnit: 11,
          actualUnitPrice: 1200,
        },
      ],
    };
    await expect(
      service.postDelivery(context, delivery.deliveryId, posting),
    ).rejects.toThrow('overdelivery-confirmation-required');
    await expect(
      service.postDelivery(context, delivery.deliveryId, {
        ...posting,
        confirmOverdelivery: true,
      }),
    ).resolves.toMatchObject({ status: 'POSTED' });
    expect((await service.queryOperations(context)).deliveries[0]?.overdelivery).toBe(
      true,
    );
  });

  it('does not post any purchasing state when Warehouse rejects receipt', async () => {
    recordSupplierDelivery.mockRejectedValueOnce(new Error('warehouse-unavailable'));
    const order = await service.createOrder(context, orderInput);
    await service.sendOrder(context, order.orderId);
    const delivery = await service.createDeliveryDraft(context, order.orderId);
    await expect(
      service.postDelivery(context, delivery.deliveryId, {
        supplierDocumentReference: 'УПД-4',
        deliveredAt: '2026-08-07',
        lines: [
          {
            orderLineId: order.lines[0]!.lineId,
            quantityPurchaseUnit: 10,
            actualUnitPrice: 1200,
          },
        ],
      }),
    ).rejects.toThrow('warehouse-unavailable');
    expect(repository.store.deliveries[0]?.status).toBe('DRAFT');
    expect(repository.store.orders[0]?.status).toBe('SENT');
    expect(repository.store.priceHistory).toHaveLength(0);
  });

  it('rejects duplicate delivery submission and keeps posted delivery immutable', async () => {
    const order = await service.createOrder(context, orderInput);
    await service.sendOrder(context, order.orderId);
    const delivery = await service.createDeliveryDraft(context, order.orderId);
    const posting = {
      supplierDocumentReference: 'УПД-5',
      deliveredAt: '2026-08-07',
      lines: [
        {
          orderLineId: order.lines[0]!.lineId,
          quantityPurchaseUnit: 10,
          actualUnitPrice: 1200,
        },
      ],
    };
    await service.postDelivery(context, delivery.deliveryId, posting);
    await expect(
      service.postDelivery(context, delivery.deliveryId, posting),
    ).rejects.toThrow('delivery-immutable');
    await expect(service.cancelDelivery(context, delivery.deliveryId)).rejects.toThrow(
      'delivery-immutable',
    );
  });

  it('allows an alternate active supplier and keeps one preferred relation', async () => {
    await service.saveAssortment(context, null, {
      supplierId: 'crash-supplier-dairy',
      resourceId: 'crash-ingredient-espresso-beans',
      preferred: true,
      active: true,
    });
    const preferred = repository.store.assortments.filter(
      (item) => item.resourceId === 'crash-ingredient-espresso-beans' && item.preferred,
    );
    expect(preferred).toHaveLength(1);
    await expect(
      service.createOrder(context, {
        ...orderInput,
        supplierId: 'crash-supplier-dairy',
      }),
    ).resolves.toMatchObject({ supplierNameSnapshot: 'Молочная линия' });
    await service.saveAssortment(context, null, {
      supplierId: 'crash-supplier-dairy',
      resourceId: 'crash-ingredient-espresso-beans',
      preferred: false,
      active: false,
    });
    expect(
      repository.store.assortments.filter(
        (item) =>
          item.supplierId === 'crash-supplier-dairy' &&
          item.resourceId === 'crash-ingredient-espresso-beans',
      ),
    ).toEqual([expect.objectContaining({ status: 'inactive', preferred: false })]);
  });

  it('rejects access from an unrelated Project or unassigned employee', async () => {
    await expect(
      service.load({ ...context, projectId: 'other-project' }),
    ).rejects.toThrow();
    await expect(
      service.load({ ...context, employeeId: 'crash-employee-cashier' }),
    ).rejects.toThrow('access-denied');
  });
});
