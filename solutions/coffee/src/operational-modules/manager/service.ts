import type { CoffeeOperationalReadRepository } from '../../repository-contracts';
import type {
  PurchasingOperationsQueryService,
  PurchasingOperationsReadModel,
} from '../purchasing/queries';
import type {
  WarehouseOperationsQueryService,
  WarehouseOperationsReadModel,
} from '../warehouse/queries';
import type {
  ManagerEvent,
  ManagerNavigationTarget,
  ManagerPreferences,
  ManagerRuntimeContext,
  ManagerWarning,
  ManagerWorkspaceReadModel,
} from './domain';
import type { CoffeeManagerWorkspaceRepository } from './repository';
import {
  managerDeliveryStatusRu,
  managerMovementTypeRu,
  managerOrderStatusRu,
} from './localization';

export interface ManagerWorkspaceState {
  readonly readModel: ManagerWorkspaceReadModel;
  readonly preferences: ManagerPreferences;
}

export interface CoffeeManagerWorkspaceService {
  load(context: ManagerRuntimeContext): Promise<ManagerWorkspaceState>;
  savePreferences(
    context: ManagerRuntimeContext,
    preferences: ManagerPreferences,
  ): Promise<ManagerPreferences>;
  subscribe(context: ManagerRuntimeContext, listener: () => void): () => void;
}

interface Dependencies {
  readonly operational: CoffeeOperationalReadRepository;
  readonly warehouse?: WarehouseOperationsQueryService;
  readonly purchasing?: PurchasingOperationsQueryService;
  readonly preferences: CoffeeManagerWorkspaceRepository;
  readonly now?: () => string;
}

type Snapshot = Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>;
type QueryResult<T> =
  | { readonly availability: 'available'; readonly data: T }
  | { readonly availability: 'unavailable'; readonly data: null };

const emptyWarehouseData: WarehouseOperationsReadModel = {
  warehouses: [],
  balances: [],
  recentMovements: [],
  issues: [],
};

const emptyPurchasingData: PurchasingOperationsReadModel = {
  needs: [],
  orders: [],
  deliveries: [],
  configurationWarnings: [],
};

async function querySafely<T>(query: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { availability: 'available', data: await query() };
  } catch {
    return { availability: 'unavailable', data: null };
  }
}

const navigation = (
  snapshot: Snapshot,
  moduleId: 'warehouse' | 'purchasing',
  section: string,
  entityId: string | null,
): ManagerNavigationTarget => ({
  moduleId,
  workspaceId:
    snapshot.solutionStructure.workspaces.find(
      (workspace) => workspace.moduleId === moduleId && workspace.status === 'active',
    )?.id ?? null,
  section,
  entityId,
});

export function createCoffeeManagerWorkspaceService({
  operational,
  warehouse,
  purchasing,
  preferences,
  now = () => new Date().toISOString(),
}: Dependencies): CoffeeManagerWorkspaceService {
  async function access(context: ManagerRuntimeContext): Promise<{
    snapshot: Snapshot;
    employeeName: string;
  }> {
    if (
      !context.projectId ||
      !context.businessEnvironmentId ||
      !context.workspaceId ||
      !context.employeeId
    )
      throw new Error('access-denied');
    const snapshot = await operational.load(context.projectId);
    const workspace = snapshot.solutionStructure.workspaces.find(
      (candidate) =>
        candidate.id === context.workspaceId &&
        candidate.moduleId === 'manager' &&
        candidate.status === 'active',
    );
    const employee = snapshot.employees.find(
      (candidate) =>
        candidate.id === context.employeeId &&
        candidate.status === 'active' &&
        candidate.employmentStatus === 'active',
    );
    const ownerPreview = context.employeeId === 'owner-preview';
    if (
      !workspace ||
      (!ownerPreview &&
        (!employee || !workspace.assignedEmployeeIds.includes(employee.id)))
    )
      throw new Error('access-denied');
    return {
      snapshot,
      employeeName: ownerPreview
        ? 'Владелец · просмотр'
        : (employee?.fullName ?? 'Сотрудник'),
    };
  }

  return {
    async load(context) {
      const { snapshot, employeeName } = await access(context);
      const [warehouseResult, purchasingResult, savedPreferences] = await Promise.all([
        querySafely(() =>
          warehouse
            ? warehouse.queryOperations(context)
            : Promise.reject(new Error('warehouse-query-unavailable')),
        ),
        querySafely(() =>
          purchasing
            ? purchasing.queryOperations(context)
            : Promise.reject(new Error('purchasing-query-unavailable')),
        ),
        preferences.load(
          context.projectId,
          context.businessEnvironmentId,
          context.employeeId,
        ),
      ]);
      const warehouseData = warehouseResult.data ?? emptyWarehouseData;
      const purchasingData = purchasingResult.data ?? emptyPurchasingData;
      const warnings: ManagerWarning[] = [];
      for (const balance of warehouseData.balances) {
        if (balance.status === 'IN_STOCK') continue;
        const critical =
          balance.status === 'OUT_OF_STOCK' || balance.status === 'NEGATIVE';
        warnings.push({
          warningId: `warehouse-balance:${balance.warehouseId}:${balance.resourceId}`,
          severity: critical ? 'critical' : 'warning',
          source: 'warehouse',
          entityId: balance.resourceId,
          message: `${balance.resourceName}: ${critical ? 'критический остаток' : 'остаток ниже минимума'} на складе «${balance.warehouseName}».`,
          suggestedAction: 'Проверьте склад и план закупки.',
          navigationTarget: navigation(
            snapshot,
            'warehouse',
            'balances',
            balance.resourceId,
          ),
        });
      }
      for (const need of purchasingData.needs) {
        if (
          need.recommendedQuantityBase !== null &&
          need.recommendedQuantityBase > 0 &&
          !need.hasOpenOrder
        ) {
          warnings.push({
            warningId: `purchase-needed:${need.warehouseId}:${need.resourceId}`,
            severity: need.quantityBase <= 0 ? 'critical' : 'warning',
            source: 'purchasing',
            entityId: need.resourceId,
            message: `${need.resourceName}: закупка рекомендована, но активного заказа нет.`,
            suggestedAction: 'Создайте заказ поставщику.',
            navigationTarget: navigation(
              snapshot,
              'purchasing',
              'needs',
              need.resourceId,
            ),
          });
        }
        if (
          need.recommendedQuantityBase !== null &&
          need.recommendedQuantityBase > 0 &&
          !need.preferredSupplierName
        ) {
          warnings.push({
            warningId: `supplier-missing:${need.resourceId}`,
            severity: 'info',
            source: 'purchasing',
            entityId: need.resourceId,
            message: `${need.resourceName}: предпочтительный поставщик не определён.`,
            suggestedAction: 'Настройте ассортимент поставщиков.',
            navigationTarget: navigation(
              snapshot,
              'purchasing',
              'suppliers',
              need.resourceId,
            ),
          });
        }
      }
      for (const order of purchasingData.orders.filter((item) => item.isOverdue)) {
        warnings.push({
          warningId: `purchase-overdue:${order.orderId}`,
          severity: 'critical',
          source: 'purchasing',
          entityId: order.orderId,
          message: `Заказ ${order.orderNumber} поставщику «${order.supplierName}» просрочен.`,
          suggestedAction: 'Уточните срок поставки у поставщика.',
          navigationTarget: navigation(snapshot, 'purchasing', 'orders', order.orderId),
        });
      }
      for (const delivery of purchasingData.deliveries) {
        if (delivery.actualPriceHigher) {
          warnings.push({
            warningId: `price-variance:${delivery.deliveryId}`,
            severity: 'warning',
            source: 'purchasing',
            entityId: delivery.deliveryId,
            message: `Поставка ${delivery.deliveryNumber}: фактическая цена выше ожидаемой.`,
            suggestedAction: 'Проверьте документ и условия поставщика.',
            navigationTarget: navigation(
              snapshot,
              'purchasing',
              'deliveries',
              delivery.deliveryId,
            ),
          });
        }
        if (delivery.overdelivery) {
          warnings.push({
            warningId: `overdelivery:${delivery.deliveryId}`,
            severity: 'warning',
            source: 'purchasing',
            entityId: delivery.deliveryId,
            message: `Поставка ${delivery.deliveryNumber}: получено больше заказанного.`,
            suggestedAction: 'Проверьте подтверждённое расхождение.',
            navigationTarget: navigation(
              snapshot,
              'purchasing',
              'deliveries',
              delivery.deliveryId,
            ),
          });
        }
      }
      for (const warning of purchasingData.configurationWarnings) {
        warnings.push({
          warningId: `purchasing-config:${warning.warningId}`,
          severity: 'warning',
          source: 'purchasing',
          entityId: warning.resourceId ?? warning.warningId,
          message: warning.message,
          suggestedAction: 'Уточните связь ресурса и поставщика.',
          navigationTarget: navigation(
            snapshot,
            'purchasing',
            'suppliers',
            warning.resourceId,
          ),
        });
      }
      for (const issue of warehouseData.issues.filter((item) => !item.resolved)) {
        warnings.push({
          warningId: `warehouse-issue:${issue.issueId}`,
          severity: 'critical',
          source: 'warehouse',
          entityId: issue.issueId,
          message: issue.message,
          suggestedAction: 'Проверьте конфигурацию склада и рецептуры.',
          navigationTarget: navigation(snapshot, 'warehouse', 'history', issue.issueId),
        });
      }

      const purchasingTarget = (section: string, entityId: string | null) =>
        navigation(snapshot, 'purchasing', section, entityId);
      const warehouseTarget = (entityId: string | null) =>
        navigation(snapshot, 'warehouse', 'history', entityId);
      const events: ManagerEvent[] = [
        ...purchasingData.orders.map((order) => ({
          eventId: `purchase-order:${order.orderId}:${order.updatedAt}`,
          timestamp: order.updatedAt,
          type: `PURCHASE_ORDER_${order.status}`,
          source: 'purchasing' as const,
          description: `Заказ ${order.orderNumber} · ${order.supplierName} · ${managerOrderStatusRu[order.status] ?? 'Статус недоступен'}.`,
          entityId: order.orderId,
          navigationTarget: purchasingTarget('orders', order.orderId),
        })),
        ...purchasingData.deliveries.map((delivery) => ({
          eventId: `purchase-delivery:${delivery.deliveryId}:${delivery.occurredAt}`,
          timestamp: delivery.occurredAt,
          type: `PURCHASE_DELIVERY_${delivery.status}`,
          source: 'purchasing' as const,
          description: `Поставка ${delivery.deliveryNumber} · ${delivery.supplierName} · ${managerDeliveryStatusRu[delivery.status] ?? 'Статус недоступен'}.`,
          entityId: delivery.deliveryId,
          navigationTarget: purchasingTarget('deliveries', delivery.deliveryId),
        })),
        ...warehouseData.recentMovements.map((movement) => ({
          eventId: `warehouse-movement:${movement.movementId}`,
          timestamp: movement.occurredAt,
          type: `WAREHOUSE_${movement.movementType}`,
          source: 'warehouse' as const,
          description: `${movement.resourceName} · ${movement.warehouseName} · ${managerMovementTypeRu[movement.movementType] ?? 'Складское движение'}.`,
          entityId: movement.movementId,
          navigationTarget: warehouseTarget(movement.resourceId),
        })),
        ...warehouseData.issues
          .filter((issue) => !issue.resolved)
          .map((issue) => ({
            eventId: `warehouse-issue:${issue.issueId}`,
            timestamp: issue.occurredAt,
            type: `WAREHOUSE_ISSUE_${issue.code}`,
            source: 'warehouse' as const,
            description: `Проблема склада · ${issue.message}`,
            entityId: issue.issueId,
            navigationTarget: warehouseTarget(issue.issueId),
          })),
      ].sort((left, right) => right.timestamp.localeCompare(left.timestamp));

      const countOrders = (status: string): number =>
        purchasingData.orders.filter((order) => order.status === status).length;
      const readModel: ManagerWorkspaceReadModel = {
        employeeName,
        sourceAvailability: {
          warehouse: warehouseResult.availability,
          purchasing: purchasingResult.availability,
          sales: 'unavailable',
        },
        salesKpis: {
          revenueToday: null,
          receiptCountToday: null,
          averageReceiptToday: null,
          currency: snapshot.businessProfile.defaultCurrency,
        },
        warehouseSummary: {
          totalResources:
            warehouseResult.availability === 'available'
              ? warehouseData.balances.length
              : null,
          belowMinimum:
            warehouseResult.availability === 'available'
              ? warehouseData.balances.filter((balance) => balance.status === 'LOW')
                  .length
              : null,
          outOfStock:
            warehouseResult.availability === 'available'
              ? warehouseData.balances.filter(
                  (balance) => balance.status === 'OUT_OF_STOCK',
                ).length
              : null,
          negative:
            warehouseResult.availability === 'available'
              ? warehouseData.balances.filter(
                  (balance) => balance.status === 'NEGATIVE',
                ).length
              : null,
          withoutThreshold:
            warehouseResult.availability === 'available'
              ? warehouseData.balances.filter(
                  (balance) => balance.minimumStockBase === null,
                ).length
              : null,
        },
        purchasingSummary: {
          drafts:
            purchasingResult.availability === 'available' ? countOrders('DRAFT') : null,
          sent:
            purchasingResult.availability === 'available' ? countOrders('SENT') : null,
          partiallyDelivered:
            purchasingResult.availability === 'available'
              ? countOrders('PARTIALLY_DELIVERED')
              : null,
          delivered:
            purchasingResult.availability === 'available'
              ? countOrders('DELIVERED')
              : null,
          cancelled:
            purchasingResult.availability === 'available'
              ? countOrders('CANCELLED')
              : null,
          overdue:
            purchasingResult.availability === 'available'
              ? purchasingData.orders.filter((order) => order.isOverdue).length
              : null,
          active:
            purchasingResult.availability === 'available'
              ? purchasingData.orders.filter(
                  (order) =>
                    order.status === 'DRAFT' ||
                    order.status === 'SENT' ||
                    order.status === 'PARTIALLY_DELIVERED',
                ).length
              : null,
        },
        purchasing: {
          orders: purchasingData.orders,
          deliveries: purchasingData.deliveries,
          needs: purchasingData.needs,
        },
        warehouse: warehouseData,
        warnings,
        events: events.slice(0, 50),
        generatedAt: now(),
      };
      return { readModel, preferences: savedPreferences };
    },
    async savePreferences(context, nextPreferences) {
      await access(context);
      return preferences.save(
        context.projectId,
        context.businessEnvironmentId,
        context.employeeId,
        nextPreferences,
      );
    },
    subscribe(context, listener) {
      const unsubscribers: Array<() => void> = [];
      const subscriptions: Array<() => () => void> = [
        () => preferences.subscribe(context.projectId, listener),
      ];
      if (warehouse) subscriptions.push(() => warehouse.subscribe(context, listener));
      if (purchasing) subscriptions.push(() => purchasing.subscribe(context, listener));
      for (const subscribe of subscriptions) {
        try {
          unsubscribers.push(subscribe());
        } catch {
          // A temporarily unavailable read source must not crash the workspace.
        }
      }
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    },
  };
}
