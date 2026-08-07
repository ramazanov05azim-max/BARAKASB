import { beforeEach, describe, expect, it } from 'vitest';
import type { CoffeeOrder } from '../../bar-domain';
import { createCoffeeCrashTestSeed } from '../../coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot } from '../../domain';
import type { CoffeeOperationalReadRepository } from '../../repository-contracts';
import type {
  WarehouseConsumptionIssue,
  WarehouseInventoryDocument,
  WarehouseMovement,
  WarehouseStore,
} from './domain';
import type { CoffeeWarehouseRepository } from './repository';
import { createCoffeeWarehouseService } from './service';

const timestamp = '2026-08-06T10:00:00.000Z';
const environmentId = 'environment-1';
const employeeId = 'crash-employee-warehouse';
const warehouseWorkspaceId = 'workspace-warehouse';
const barWorkspaceId = 'workspace-bar';

function snapshot(): CoffeeOperationalSnapshot {
  const seed = createCoffeeCrashTestSeed(timestamp);
  return {
    project: {
      id: 'project-1',
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
      enabledModules: 'warehouse',
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
      selectedModuleIds: ['warehouse', 'bar', 'kitchen'],
      workspaces: [
        {
          id: warehouseWorkspaceId,
          moduleId: 'warehouse',
          assignedEmployeeIds: [employeeId],
          assignedWarehouseIds: ['crash-warehouse-main', 'crash-warehouse-bar'],
          sourceWarehouseId: 'crash-warehouse-main',
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: barWorkspaceId,
          moduleId: 'bar',
          assignedEmployeeIds: ['crash-employee-barista'],
          assignedWarehouseIds: [],
          sourceWarehouseId: 'crash-warehouse-bar',
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'workspace-kitchen',
          moduleId: 'kitchen',
          assignedEmployeeIds: ['crash-employee-kitchen'],
          assignedWarehouseIds: [],
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

class MemoryWarehouseRepository implements CoffeeWarehouseRepository {
  store: WarehouseStore = {
    schemaVersion: 1,
    movements: [],
    inventories: [],
    issues: [],
  };
  async load() {
    return structuredClone(this.store);
  }
  async appendBatch(
    _projectId: string,
    _environmentId: string,
    movements: ReadonlyArray<WarehouseMovement>,
    issue?: WarehouseConsumptionIssue,
  ) {
    const existing = new Set(this.store.movements.map((entry) => entry.idempotencyKey));
    if (movements.some((entry) => existing.has(entry.idempotencyKey)))
      return structuredClone(this.store);
    this.store = {
      ...this.store,
      movements: [...this.store.movements, ...structuredClone(movements)],
      issues: issue ? [...this.store.issues, issue] : this.store.issues,
    };
    return structuredClone(this.store);
  }
  async saveInventory(
    _projectId: string,
    _environmentId: string,
    inventory: WarehouseInventoryDocument,
  ) {
    const existing = this.store.inventories.find(
      (entry) => entry.inventoryId === inventory.inventoryId,
    );
    if (existing?.status === 'POSTED') throw new Error('inventory-immutable');
    this.store = {
      ...this.store,
      inventories: existing
        ? this.store.inventories.map((entry) =>
            entry.inventoryId === inventory.inventoryId ? inventory : entry,
          )
        : [...this.store.inventories, inventory],
    };
    return structuredClone(this.store);
  }
  async recordIssue(
    _projectId: string,
    _environmentId: string,
    issue: WarehouseConsumptionIssue,
  ) {
    if (!this.store.issues.some((entry) => entry.issueId === issue.issueId))
      this.store = { ...this.store, issues: [...this.store.issues, issue] };
    return structuredClone(this.store);
  }
  subscribe() {
    return () => undefined;
  }
}

const context = {
  projectId: 'project-1',
  businessEnvironmentId: environmentId,
  workspaceId: warehouseWorkspaceId,
  employeeId,
};
const barContext = {
  ...context,
  workspaceId: barWorkspaceId,
  employeeId: 'crash-employee-barista',
};
const operational = (
  value: CoffeeOperationalSnapshot,
): CoffeeOperationalReadRepository => ({
  load: async (projectId) => {
    if (projectId !== value.project.id) throw new Error('not-found');
    return structuredClone(value);
  },
});

function completedOrder(productId = 'crash-item-espresso'): CoffeeOrder {
  return {
    orderId: 'order-1',
    projectId: 'project-1',
    businessEnvironmentId: environmentId,
    workspaceId: barWorkspaceId,
    locationId: 'crash-location-main',
    orderType: 'TAKEAWAY',
    tableId: null,
    orderNumber: 'Б-0001',
    status: 'COMPLETED',
    guestCount: 1,
    seatingNote: '',
    openedAt: timestamp,
    openedByEmployeeId: barContext.employeeId,
    createdAt: timestamp,
    createdByEmployeeId: barContext.employeeId,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    paidAmount: 190,
    paidAt: timestamp,
    paidByEmployeeId: barContext.employeeId,
    total: 190,
    issuedAt: timestamp,
    completedAt: timestamp,
    completedByEmployeeId: barContext.employeeId,
    cancellationReason: null,
    updatedAt: timestamp,
    items: [
      {
        id: 'item-1',
        productId,
        productName: 'Эспрессо',
        variantName: null,
        quantity: 1,
        unitPrice: 190,
        finalUnitPrice: 190,
        modifiers: [],
        comment: '',
        preparationWorkspace: 'BAR',
        status: 'READY',
        submittedBatchId: 'batch-1',
        issuedAt: timestamp,
        issuedByEmployeeId: barContext.employeeId,
      },
    ],
    batches: [],
  };
}

describe('CoffeeWarehouseService ledger', () => {
  let repository: MemoryWarehouseRepository;
  let service: ReturnType<typeof createCoffeeWarehouseService>;
  beforeEach(() => {
    repository = new MemoryWarehouseRepository();
    service = createCoffeeWarehouseService({
      operational: operational(snapshot()),
      warehouse: repository,
      now: () => timestamp,
      createId: (() => {
        let value = 0;
        return () => `id-${++value}`;
      })(),
    });
  });

  it('creates one opening movement and derives balance from movement sum', async () => {
    await service.recordOpeningBalance(context, {
      warehouseId: 'crash-warehouse-main',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 2,
      unitId: 'unit-kg',
      idempotencyKey: 'open-1',
    });
    await service.recordOpeningBalance(context, {
      warehouseId: 'crash-warehouse-main',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 2,
      unitId: 'unit-kg',
      idempotencyKey: 'open-1',
    });
    expect(repository.store.movements).toHaveLength(1);
    expect(repository.store.movements[0]?.quantityDeltaBase).toBe(2000);
    const state = await service.load(context);
    expect(
      state.balances.find(
        (entry) =>
          entry.resource.resourceId === 'crash-ingredient-espresso-beans' &&
          entry.warehouseId === 'crash-warehouse-main',
      )?.quantityBase,
    ).toBe(2000);
  });

  it('publishes a minimal current operations query without repository internals', async () => {
    await service.recordOpeningBalance(context, {
      warehouseId: 'crash-warehouse-main',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 2,
      unitId: 'unit-kg',
      idempotencyKey: 'public-query-open',
    });
    const result = await service.queryOperations(context);
    expect(
      result.balances.find(
        (balance) => balance.resourceId === 'crash-ingredient-espresso-beans',
      ),
    ).toMatchObject({
      warehouseName: 'Главный склад',
      quantityBase: 2000,
      status: 'LOW',
    });
    expect(result).not.toHaveProperty('inventories');
    expect(result).not.toHaveProperty('employees');
  });

  it('converts a purchase package, writes off and transfers atomically', async () => {
    await service.recordReceipt(context, {
      warehouseId: 'crash-warehouse-main',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 2,
      unitId: 'unit-kg',
      idempotencyKey: 'receipt-1',
    });
    await service.recordWriteOff(context, {
      warehouseId: 'crash-warehouse-main',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 100,
      unitId: 'unit-g',
      reason: 'Порча',
      idempotencyKey: 'write-1',
    });
    await service.transfer(context, {
      sourceWarehouseId: 'crash-warehouse-main',
      destinationWarehouseId: 'crash-warehouse-bar',
      resourceId: 'crash-ingredient-espresso-beans',
      quantity: 500,
      unitId: 'unit-g',
      idempotencyKey: 'transfer-1',
    });
    expect(repository.store.movements.map((entry) => entry.quantityDeltaBase)).toEqual([
      2000, -100, -500, 500,
    ]);
    expect(
      repository.store.movements.slice(-2).map((entry) => entry.sourceDocumentId)[0],
    ).toBe(repository.store.movements.at(-1)?.sourceDocumentId);
  });

  it('posts surplus and shortage and keeps posted inventory immutable', async () => {
    const draft = await service.createInventory(context, 'crash-warehouse-main');
    const first = draft.lines[0]!;
    const second = draft.lines[1]!;
    await service.updateInventoryLine(
      context,
      draft.inventoryId,
      first.resourceId,
      10,
      snapshot().ingredients.find((item) => item.id === first.resourceId)!.baseUnitId,
    );
    for (const line of draft.lines.slice(1))
      await service.updateInventoryLine(
        context,
        draft.inventoryId,
        line.resourceId,
        line === second ? 5 : 0,
        snapshot().ingredients.find((item) => item.id === line.resourceId)!.baseUnitId,
      );
    await service.postInventory(context, draft.inventoryId);
    expect(
      repository.store.movements.some(
        (entry) => entry.movementType === 'INVENTORY_SURPLUS',
      ),
    ).toBe(true);
    await expect(
      service.updateInventoryLine(
        context,
        draft.inventoryId,
        first.resourceId,
        3,
        'unit-g',
      ),
    ).rejects.toThrow('inventory-immutable');
  });

  it('consumes a completed Bar order exactly once and exposes negative stock', async () => {
    const order = completedOrder();
    await service.consumeCompletedOrder(barContext, order);
    await service.consumeCompletedOrder(barContext, order);
    const sale = repository.store.movements.filter(
      (entry) => entry.movementType === 'SALE_CONSUMPTION',
    );
    expect(sale.length).toBeGreaterThan(0);
    expect(new Set(sale.map((entry) => entry.idempotencyKey)).size).toBe(sale.length);
    expect(
      (await service.load(context)).balances.some(
        (entry) => entry.status === 'NEGATIVE',
      ),
    ).toBe(true);
  });

  it('uses the immutable order-line recipe snapshot instead of current menu data', async () => {
    const original = completedOrder('removed-menu-item');
    const order: CoffeeOrder = {
      ...original,
      items: original.items.map((item) => ({
        ...item,
        quantity: 2,
        stockConsumptionSnapshot: {
          recipeId: 'recipe-at-order-time',
          requirements: [
            {
              resourceId: 'crash-ingredient-espresso-beans',
              resourceType: 'ingredient',
              quantityBasePerItem: 18,
              baseUnit: 'g',
            },
          ],
          issueCode: null,
        },
      })),
    };

    await service.consumeCompletedOrder(barContext, order);

    expect(
      repository.store.movements.find(
        (movement) => movement.movementType === 'SALE_CONSUMPTION',
      )?.quantityDeltaBase,
    ).toBe(-36);
    expect(repository.store.issues).toEqual([]);
  });

  it('does not consume an uncompleted order', async () => {
    await service.consumeCompletedOrder(barContext, {
      ...completedOrder(),
      status: 'READY',
    });
    expect(repository.store.movements).toHaveLength(0);
  });

  it('consumes Kitchen-routed positions from the explicitly assigned Kitchen warehouse', async () => {
    const kitchen = completedOrder();
    await service.consumeCompletedOrder(barContext, {
      ...kitchen,
      items: kitchen.items.map((item) => ({
        ...item,
        preparationWorkspace: 'KITCHEN',
      })),
    });
    expect(repository.store.movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warehouseId: 'crash-warehouse-kitchen',
          movementType: 'SALE_CONSUMPTION',
          idempotencyKey: expect.stringContaining('sale:order-1:kitchen:'),
        }),
      ]),
    );
  });

  it('never guesses a Kitchen warehouse and records an unresolved issue', async () => {
    const value = snapshot();
    value.solutionStructure.workspaces[2]!.sourceWarehouseId = null;
    service = createCoffeeWarehouseService({
      operational: operational(value),
      warehouse: repository,
      now: () => timestamp,
    });
    const kitchen = completedOrder();
    await service.consumeCompletedOrder(barContext, {
      ...kitchen,
      items: kitchen.items.map((item) => ({
        ...item,
        preparationWorkspace: 'KITCHEN',
      })),
    });
    expect(repository.store.movements).toHaveLength(0);
    expect(repository.store.issues).toEqual([
      expect.objectContaining({
        code: 'WAREHOUSE_NOT_ASSIGNED',
        issueId: 'order:order-1:kitchen:WAREHOUSE_NOT_ASSIGNED',
      }),
    ]);
  });

  it('does not consume a cancelled order', async () => {
    await service.consumeCompletedOrder(barContext, {
      ...completedOrder(),
      status: 'CANCELLED',
      cancellationReason: 'Ошибка заказа',
    });
    expect(repository.store.movements).toHaveLength(0);
  });

  it('records an unresolved issue when the completed line has no active recipe', async () => {
    await service.consumeCompletedOrder(
      barContext,
      completedOrder('menu-item-without-recipe'),
    );
    expect(repository.store.movements).toHaveLength(0);
    expect(repository.store.issues[0]?.code).toBe('RECIPE_NOT_FOUND');
  });

  it('records a visible issue and never guesses when source warehouse is absent', async () => {
    const value = snapshot();
    value.solutionStructure.workspaces[1]!.sourceWarehouseId = null;
    service = createCoffeeWarehouseService({
      operational: operational(value),
      warehouse: repository,
      now: () => timestamp,
    });
    await service.consumeCompletedOrder(barContext, completedOrder());
    expect(repository.store.movements).toHaveLength(0);
    expect(repository.store.issues[0]?.code).toBe('WAREHOUSE_NOT_ASSIGNED');
  });

  it('rejects employee access outside the assigned project workspace', async () => {
    await expect(
      service.load({ ...context, employeeId: 'crash-employee-cashier' }),
    ).rejects.toThrow('access-denied');
    await expect(
      service.load({ ...context, projectId: 'other-project' }),
    ).rejects.toThrow();
  });
});
