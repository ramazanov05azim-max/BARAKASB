import { describe, expect, it, vi } from 'vitest';
import { createCoffeeCrashTestSeed } from '../../coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot } from '../../domain';
import type { CoffeeOperationalReadRepository } from '../../repository-contracts';
import type { PurchasingOperationsReadModel } from '../purchasing/service';
import type { WarehouseOperationsReadModel } from '../warehouse/service';
import type { CoffeeManagerWorkspaceRepository } from './repository';
import { createCoffeeManagerWorkspaceService } from './service';

const timestamp = '2026-08-07T12:00:00.000Z';
const context = {
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  workspaceId: 'workspace-manager',
  employeeId: 'owner-preview',
};

function snapshot(): CoffeeOperationalSnapshot {
  const seed = createCoffeeCrashTestSeed(timestamp);
  return {
    project: {
      id: context.projectId,
      name: seed.projectDisplayName,
      solutionStatus: 'configured',
      defaultLocationId: seed.locations[0]?.id ?? null,
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
      enabledModules: 'manager,warehouse,purchasing',
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
      selectedModuleIds: ['manager', 'warehouse', 'purchasing'],
      workspaces: [
        {
          id: context.workspaceId,
          moduleId: 'manager',
          assignedEmployeeIds: [],
          assignedWarehouseIds: [],
          sourceWarehouseId: null,
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'workspace-warehouse',
          moduleId: 'warehouse',
          assignedEmployeeIds: [],
          assignedWarehouseIds: [],
          sourceWarehouseId: null,
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'workspace-purchasing',
          moduleId: 'purchasing',
          assignedEmployeeIds: [],
          assignedWarehouseIds: [],
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

function warehouseRead(
  status: 'LOW' | 'IN_STOCK' = 'LOW',
): WarehouseOperationsReadModel {
  return {
    warehouses: [{ id: 'warehouse-1', name: 'Основной склад' }],
    balances: [
      {
        warehouseId: 'warehouse-1',
        warehouseName: 'Основной склад',
        resourceId: 'resource-1',
        resourceName: 'Зерно',
        resourceType: 'ingredient',
        accountingType: 'weight',
        quantityBase: status === 'LOW' ? 100 : 2_000,
        baseUnit: 'g',
        baseUnitId: 'unit-g',
        purchaseUnitId: 'unit-kg',
        purchasePackageSize: 1_000,
        minimumStockBase: 1_000,
        status,
      },
    ],
    recentMovements: [],
    issues: [],
  };
}

function purchasingRead(hasOpenOrder = false): PurchasingOperationsReadModel {
  return {
    needs: [
      {
        warehouseId: 'warehouse-1',
        warehouseName: 'Основной склад',
        resourceId: 'resource-1',
        resourceName: 'Зерно',
        quantityBase: 100,
        baseUnit: 'g',
        thresholdBase: 1_000,
        recommendedQuantityBase: 900,
        state: 'BELOW_MINIMUM',
        preferredSupplierName: 'Поставщик кофе',
        hasOpenOrder,
      },
    ],
    orders: [],
    deliveries: [],
    configurationWarnings: [],
  };
}

function preferences(): CoffeeManagerWorkspaceRepository {
  return {
    load: async () => ({
      schemaVersion: 1,
      selectedSection: 'overview',
      warningsOnly: false,
      hiddenPanelKeys: [],
    }),
    save: async (_project, _environment, _employee, value) => value,
    subscribe: () => () => undefined,
  };
}

describe('Coffee Manager workspace service', () => {
  it('aggregates only public owner-module queries and leaves absent Sales KPIs null', async () => {
    const warehouseQuery = vi.fn(async () => warehouseRead());
    const purchasingQuery = vi.fn(async () => purchasingRead());
    const operational: CoffeeOperationalReadRepository = {
      load: async () => snapshot(),
    };
    const service = createCoffeeManagerWorkspaceService({
      operational,
      warehouse: { queryOperations: warehouseQuery, subscribe: () => () => undefined },
      purchasing: {
        queryOperations: purchasingQuery,
        subscribe: () => () => undefined,
      },
      preferences: preferences(),
      now: () => timestamp,
    });
    const state = await service.load(context);
    expect(warehouseQuery).toHaveBeenCalledWith(context);
    expect(purchasingQuery).toHaveBeenCalledWith(context);
    expect(state.readModel.salesKpis).toMatchObject({
      revenueToday: null,
      receiptCountToday: null,
      averageReceiptToday: null,
    });
    expect(state.readModel.warnings.map((warning) => warning.warningId)).toEqual(
      expect.arrayContaining([
        'warehouse-balance:warehouse-1:resource-1',
        'purchase-needed:warehouse-1:resource-1',
      ]),
    );
  });

  it('recomputes warnings on every refresh instead of persisting them', async () => {
    let warehouseState = warehouseRead();
    let purchasingState = purchasingRead();
    const service = createCoffeeManagerWorkspaceService({
      operational: { load: async () => snapshot() },
      warehouse: {
        queryOperations: async () => warehouseState,
        subscribe: () => () => undefined,
      },
      purchasing: {
        queryOperations: async () => purchasingState,
        subscribe: () => () => undefined,
      },
      preferences: preferences(),
    });
    expect((await service.load(context)).readModel.warnings.length).toBeGreaterThan(0);
    warehouseState = warehouseRead('IN_STOCK');
    purchasingState = purchasingRead(true);
    expect((await service.load(context)).readModel.warnings).toHaveLength(0);
  });

  it('uses owner-provided overdue and delivery-variance facts for severity warnings', async () => {
    const base = purchasingRead(true);
    const ownerFacts: PurchasingOperationsReadModel = {
      ...base,
      orders: [
        {
          orderId: 'order-1',
          orderNumber: 'ЗП-0001',
          supplierName: 'Поставщик кофе',
          destinationWarehouseId: 'warehouse-1',
          destinationWarehouseName: 'Основной склад',
          status: 'SENT',
          expectedDeliveryAt: '2026-08-01',
          isOverdue: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          employeeId: 'employee-1',
          totalExpected: 1000,
          resourceNames: ['Зерно'],
        },
      ],
      deliveries: [
        {
          deliveryId: 'delivery-1',
          deliveryNumber: 'ПС-0001',
          supplierOrderId: 'order-1',
          supplierName: 'Поставщик кофе',
          destinationWarehouseId: 'warehouse-1',
          destinationWarehouseName: 'Основной склад',
          status: 'POSTED',
          supplierDocumentReference: 'УПД-1',
          deliveredAt: '2026-08-07',
          occurredAt: timestamp,
          employeeId: 'employee-1',
          totalActual: 1200,
          expectedTotalForDeliveredQuantity: 1000,
          actualPriceHigher: true,
          overdelivery: true,
          resourceNames: ['Зерно'],
        },
      ],
    };
    const service = createCoffeeManagerWorkspaceService({
      operational: { load: async () => snapshot() },
      warehouse: {
        queryOperations: async () => warehouseRead('IN_STOCK'),
        subscribe: () => () => undefined,
      },
      purchasing: {
        queryOperations: async () => ownerFacts,
        subscribe: () => () => undefined,
      },
      preferences: preferences(),
    });
    const warnings = (await service.load(context)).readModel.warnings;
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warningId: 'purchase-overdue:order-1',
          severity: 'critical',
        }),
        expect.objectContaining({ warningId: 'price-variance:delivery-1' }),
        expect.objectContaining({ warningId: 'overdelivery:delivery-1' }),
      ]),
    );
  });

  it('rejects a workspace outside the Manager boundary', async () => {
    const service = createCoffeeManagerWorkspaceService({
      operational: { load: async () => snapshot() },
      warehouse: {
        queryOperations: async () => warehouseRead(),
        subscribe: () => () => undefined,
      },
      purchasing: {
        queryOperations: async () => purchasingRead(),
        subscribe: () => () => undefined,
      },
      preferences: preferences(),
    });
    await expect(
      service.load({ ...context, workspaceId: 'workspace-warehouse' }),
    ).rejects.toThrow('access-denied');
  });
});
