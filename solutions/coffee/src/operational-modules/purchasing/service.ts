import type { Supplier } from '../../domain';
import type {
  CoffeeOperationalReadRepository,
  CollectionRepository,
} from '../../repository-contracts';
import {
  localCoffeeManagerRepositories,
  localCoffeeOperationalReadRepository,
} from '../../repositories';
import { localCoffeeWarehouseService } from '../warehouse/service';
import type {
  WarehouseOperationsQueryService,
  WarehouseOperationsReadModel,
  WarehouseOperationsResource,
} from '../warehouse/queries';
import type {
  WarehouseSupplierReceiptInput,
  WarehouseSupplyReceiptService,
} from '../warehouse/supply';
import type {
  PurchaseDelivery,
  PurchaseDeliveryLine,
  PurchaseNeed,
  PurchasePriceHistoryEntry,
  PurchaserRuntimeContext,
  PurchaserState,
  PurchaseThresholdProvider,
  PurchasingWarehouseBalance,
  PurchasingWarehouseResource,
  SupplierAssortment,
  SupplierOrder,
  SupplierOrderLine,
} from './domain';
import type { CoffeePurchaserRepository } from './repository';
import { localCoffeePurchaserRepository } from './repository';
import type { PurchasingOperationsQueryService } from './queries';

export interface SupplierOrderLineInput {
  readonly resourceId: string;
  readonly quantityPurchaseUnit: number;
  readonly expectedUnitPrice: number;
}

export interface SupplierOrderInput {
  readonly supplierId: string;
  readonly destinationWarehouseId: string;
  readonly expectedDeliveryAt?: string | null;
  readonly comment?: string;
  readonly lines: ReadonlyArray<SupplierOrderLineInput>;
}

export interface PurchaseDeliveryPostingInput {
  readonly supplierDocumentReference: string;
  readonly deliveredAt: string;
  readonly comment?: string;
  readonly confirmOverdelivery?: boolean;
  readonly lines: ReadonlyArray<{
    readonly orderLineId: string;
    readonly quantityPurchaseUnit: number;
    readonly actualUnitPrice: number;
  }>;
}

export interface SupplierInput {
  readonly name: string;
  readonly contactPerson: string;
  readonly phone: string;
  readonly email: string;
  readonly comment: string;
  readonly status: 'active' | 'inactive';
}

export interface AssortmentInput {
  readonly supplierId: string;
  readonly resourceId: string;
  readonly supplierProductName?: string | null;
  readonly supplierSku?: string | null;
  readonly lastKnownPrice?: number | null;
  readonly preferred: boolean;
  readonly active: boolean;
}

export interface CoffeePurchaserService extends PurchasingOperationsQueryService {
  load(context: PurchaserRuntimeContext): Promise<PurchaserState>;
  createOrder(
    context: PurchaserRuntimeContext,
    input: SupplierOrderInput,
  ): Promise<SupplierOrder>;
  updateDraftOrder(
    context: PurchaserRuntimeContext,
    orderId: string,
    input: SupplierOrderInput,
  ): Promise<SupplierOrder>;
  sendOrder(context: PurchaserRuntimeContext, orderId: string): Promise<SupplierOrder>;
  cancelOrder(
    context: PurchaserRuntimeContext,
    orderId: string,
    reason: string,
  ): Promise<SupplierOrder>;
  createDeliveryDraft(
    context: PurchaserRuntimeContext,
    orderId: string,
  ): Promise<PurchaseDelivery>;
  postDelivery(
    context: PurchaserRuntimeContext,
    deliveryId: string,
    input: PurchaseDeliveryPostingInput,
  ): Promise<PurchaseDelivery>;
  cancelDelivery(
    context: PurchaserRuntimeContext,
    deliveryId: string,
  ): Promise<PurchaseDelivery>;
  saveSupplier(
    context: PurchaserRuntimeContext,
    supplierId: string | null,
    input: SupplierInput,
  ): Promise<void>;
  deleteSupplier(context: PurchaserRuntimeContext, supplierId: string): Promise<void>;
  saveAssortment(
    context: PurchaserRuntimeContext,
    assortmentId: string | null,
    input: AssortmentInput,
  ): Promise<void>;
  removeAssortment(
    context: PurchaserRuntimeContext,
    assortmentId: string,
  ): Promise<void>;
}

interface Dependencies {
  readonly operational: CoffeeOperationalReadRepository;
  readonly purchaser: CoffeePurchaserRepository;
  readonly warehouse: WarehouseOperationsQueryService & WarehouseSupplyReceiptService;
  readonly suppliers: CollectionRepository<Supplier>;
  readonly thresholds?: PurchaseThresholdProvider;
  readonly now?: () => string;
  readonly createId?: () => string;
}

type Snapshot = Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>;
interface PurchasingWarehouseRead {
  readonly warehouses: WarehouseOperationsReadModel['warehouses'];
  readonly resources: ReadonlyArray<WarehouseOperationsResource>;
  readonly balances: ReadonlyArray<
    Omit<PurchasingWarehouseBalance, 'resource'> & {
      readonly resource: WarehouseOperationsResource;
    }
  >;
}

const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;
const money = (value: number): number => Math.round(value * 100) / 100;

function nextNumber(prefix: string, values: ReadonlyArray<string>): string {
  const highest = values.reduce((maximum, value) => {
    const numeric = Number.parseInt(value.replace(/\D/gu, ''), 10);
    return Number.isFinite(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`;
}

function requiredText(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function activePurchasableResources(
  state: Pick<PurchasingWarehouseRead, 'resources'>,
): PurchasingWarehouseResource[] {
  return state.resources.filter(
    (resource): resource is PurchasingWarehouseResource =>
      resource.active &&
      (resource.resourceType === 'ingredient' || resource.resourceType === 'package'),
  );
}

export function createCoffeePurchaserService({
  operational,
  purchaser,
  warehouse,
  suppliers,
  thresholds,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): CoffeePurchaserService {
  async function access(
    context: PurchaserRuntimeContext,
    allowReadConsumer = false,
  ): Promise<{
    snapshot: Snapshot;
    workspace: Snapshot['solutionStructure']['workspaces'][number];
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
        (allowReadConsumer || candidate.moduleId === 'purchasing'),
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
    return { snapshot, workspace };
  }

  async function migrateLegacyAssortment(
    context: PurchaserRuntimeContext,
    snapshot: Snapshot,
  ): Promise<void> {
    let store = await purchaser.load(context.projectId, context.businessEnvironmentId);
    const warnings = [...store.warnings];
    for (const ingredient of snapshot.ingredients) {
      const references = ingredient.supplierReferences
        .split(/[;,]/u)
        .map((value) => value.trim())
        .filter(Boolean);
      if (references.length === 0) continue;
      for (const supplierId of references) {
        const supplier = snapshot.suppliers.find(
          (candidate) => candidate.id === supplierId,
        );
        if (!supplier) {
          const warningId = `legacy-supplier:${ingredient.id}:${supplierId}`;
          if (!warnings.some((warning) => warning.warningId === warningId)) {
            warnings.push({
              warningId,
              resourceId: ingredient.id,
              message: `Не удалось безопасно сопоставить поставщика для «${ingredient.name}».`,
            });
          }
          continue;
        }
        const assortmentId = `legacy:${supplier.id}:${ingredient.id}`;
        if (store.assortments.some((item) => item.assortmentId === assortmentId)) {
          continue;
        }
        store = await purchaser.saveAssortment(
          context.projectId,
          context.businessEnvironmentId,
          {
            assortmentId,
            supplierId: supplier.id,
            resourceId: ingredient.id,
            resourceType:
              ingredient.resourceType === 'package' ? 'package' : 'ingredient',
            supplierProductName: null,
            supplierSku: null,
            purchaseUnitId: ingredient.purchaseUnitId,
            purchaseUnitName:
              snapshot.units.find((unit) => unit.id === ingredient.purchaseUnitId)
                ?.name ?? 'Единица закупки',
            packageSize:
              ingredient.purchasePackageSize ?? ingredient.conversionRate ?? 1,
            lastKnownPrice: ingredient.cost > 0 ? ingredient.cost : null,
            currency: snapshot.businessProfile.defaultCurrency,
            preferred: ingredient.preferredSupplierId === supplier.id,
            status: 'active',
            updatedAt: now(),
          },
        );
      }
    }
    if (JSON.stringify(warnings) !== JSON.stringify(store.warnings)) {
      await purchaser.saveWarnings(
        context.projectId,
        context.businessEnvironmentId,
        warnings,
      );
    }
  }

  async function operationalState(context: PurchaserRuntimeContext) {
    const { snapshot, workspace } = await access(context);
    await migrateLegacyAssortment(context, snapshot);
    const [warehouseOperations, store] = await Promise.all([
      warehouse.queryOperations(context),
      purchaser.load(context.projectId, context.businessEnvironmentId),
    ]);
    const warehouseState = purchasingWarehouseRead(warehouseOperations);
    return { snapshot, workspace, warehouseState, store };
  }

  function purchasingWarehouseRead(
    operations: WarehouseOperationsReadModel,
  ): PurchasingWarehouseRead {
    const resourceList = operations.resources;
    return {
      warehouses: operations.warehouses,
      resources: resourceList,
      balances: operations.balances.flatMap((balance) => {
        const resource = resourceList.find(
          (candidate) =>
            candidate.resourceId === balance.resourceId &&
            candidate.resourceType === balance.resourceType,
        );
        return resource
          ? [
              {
                warehouseId: balance.warehouseId,
                resource,
                quantityBase: balance.quantityBase,
                lastMovementAt: null,
                status: balance.status,
              },
            ]
          : [];
      }),
    };
  }

  async function buildNeeds(
    context: PurchaserRuntimeContext,
    snapshot: Snapshot,
    warehouseState: PurchasingWarehouseRead,
    store: Awaited<ReturnType<CoffeePurchaserRepository['load']>>,
  ): Promise<PurchaseNeed[]> {
    const resources = activePurchasableResources(warehouseState);
    return Promise.all(
      warehouseState.balances
        .filter((balance) =>
          resources.some(
            (resource) =>
              resource.resourceId === balance.resource.resourceId &&
              resource.resourceType === balance.resource.resourceType,
          ),
        )
        .map(async (balance): Promise<PurchaseNeed> => {
          const resource = resources.find(
            (candidate) =>
              candidate.resourceId === balance.resource.resourceId &&
              candidate.resourceType === balance.resource.resourceType,
          );
          if (!resource) throw new Error('resource-not-found');
          const physicalWarehouse = warehouseState.warehouses.find(
            (candidate) => candidate.id === balance.warehouseId,
          )!;
          const configuredThreshold = thresholds
            ? await thresholds.getThreshold({
                projectId: context.projectId,
                warehouseId: balance.warehouseId,
                resourceId: resource.resourceId,
                locationId:
                  snapshot.warehouses.find(
                    (candidate) => candidate.id === balance.warehouseId,
                  )?.locationId ?? null,
              })
            : null;
          const thresholdBase =
            configuredThreshold?.targetBase ?? resource.minimumStockBase;
          const recommendation =
            thresholdBase === null
              ? null
              : Math.max(0, round(thresholdBase - balance.quantityBase));
          const assortments = store.assortments.filter(
            (item) =>
              item.resourceId === resource.resourceId && item.status === 'active',
          );
          const preferred = assortments.find((item) => item.preferred);
          const lastPrice = [...store.priceHistory]
            .filter((item) => item.resourceId === resource.resourceId)
            .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
          const ingredient = snapshot.ingredients.find(
            (candidate) => candidate.id === resource.resourceId,
          );
          return {
            warehouseId: physicalWarehouse.id,
            warehouseName: physicalWarehouse.name,
            resource,
            balance: { ...balance, resource },
            thresholdBase,
            recommendedQuantityBase: recommendation,
            state:
              balance.quantityBase < 0
                ? 'NEGATIVE'
                : balance.quantityBase === 0
                  ? 'OUT_OF_STOCK'
                  : thresholdBase !== null && balance.quantityBase < thresholdBase
                    ? 'BELOW_MINIMUM'
                    : 'SUFFICIENT',
            preferredSupplier:
              snapshot.suppliers.find(
                (supplier) => supplier.id === preferred?.supplierId,
              ) ?? null,
            lastPrice: lastPrice ?? null,
            barcode: ingredient?.barcode?.trim() || null,
          };
        }),
    );
  }

  async function toOrderLines(
    context: PurchaserRuntimeContext,
    inputs: ReadonlyArray<SupplierOrderLineInput>,
  ): Promise<SupplierOrderLine[]> {
    const { snapshot, warehouseState } = await operationalState(context);
    if (inputs.length === 0) throw new Error('order-empty');
    if (new Set(inputs.map((input) => input.resourceId)).size !== inputs.length)
      throw new Error('duplicate-resource');
    return inputs.map((input) => {
      const resource = activePurchasableResources(warehouseState).find(
        (candidate) => candidate.resourceId === input.resourceId,
      );
      if (!resource) throw new Error('resource-not-found');
      if (
        !Number.isFinite(input.quantityPurchaseUnit) ||
        input.quantityPurchaseUnit <= 0 ||
        !Number.isFinite(input.expectedUnitPrice) ||
        input.expectedUnitPrice < 0
      )
        throw new Error('invalid-order-line');
      return {
        lineId: createId(),
        resourceId: resource.resourceId,
        resourceType: resource.resourceType,
        resourceNameSnapshot: resource.name,
        purchaseUnitId: resource.purchaseUnitId,
        purchaseUnitNameSnapshot:
          snapshot.units.find((unit) => unit.id === resource.purchaseUnitId)?.name ??
          'Единица закупки',
        packageSizeSnapshot: resource.purchasePackageSize,
        baseUnit: resource.baseUnit,
        orderedQuantityPurchaseUnit: input.quantityPurchaseUnit,
        orderedQuantityBase: round(
          input.quantityPurchaseUnit * resource.purchasePackageSize,
        ),
        expectedUnitPrice: money(input.expectedUnitPrice),
        expectedLineTotal: money(input.quantityPurchaseUnit * input.expectedUnitPrice),
      };
    });
  }

  async function orderDocument(
    context: PurchaserRuntimeContext,
    input: SupplierOrderInput,
    existing?: SupplierOrder,
  ): Promise<SupplierOrder> {
    const { snapshot, warehouseState, store } = await operationalState(context);
    const supplier = snapshot.suppliers.find(
      (candidate) => candidate.id === input.supplierId && candidate.status === 'active',
    );
    const destination = warehouseState.warehouses.find(
      (candidate) => candidate.id === input.destinationWarehouseId,
    );
    if (!supplier || !destination) throw new Error('configuration-not-found');
    const lines = await toOrderLines(context, input.lines);
    const timestamp = now();
    return {
      orderId: existing?.orderId ?? createId(),
      orderNumber:
        existing?.orderNumber ??
        nextNumber(
          'ЗП',
          store.orders.map((order) => order.orderNumber),
        ),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      supplierId: supplier.id,
      supplierNameSnapshot: supplier.name,
      destinationWarehouseId: destination.id,
      destinationWarehouseNameSnapshot: destination.name,
      status: 'DRAFT',
      createdAt: existing?.createdAt ?? timestamp,
      createdByEmployeeId: existing?.createdByEmployeeId ?? context.employeeId,
      workspaceId: context.workspaceId,
      expectedDeliveryAt: input.expectedDeliveryAt || null,
      comment: input.comment?.trim() ?? '',
      lines,
      sentAt: null,
      sentByEmployeeId: null,
      cancelledAt: null,
      cancelledByEmployeeId: null,
      cancellationReason: null,
      updatedAt: timestamp,
    };
  }

  return {
    async load(context) {
      const { snapshot, warehouseState, store } = await operationalState(context);
      const resources = activePurchasableResources(warehouseState);
      return {
        employeeName:
          context.employeeId === 'owner-preview'
            ? 'Владелец · просмотр'
            : (snapshot.employees.find((employee) => employee.id === context.employeeId)
                ?.fullName ?? 'Сотрудник'),
        employees: snapshot.employees.map((employee) => ({
          id: employee.id,
          name: employee.fullName,
        })),
        warehouses: warehouseState.warehouses,
        suppliers: snapshot.suppliers,
        resources,
        needs: await buildNeeds(context, snapshot, warehouseState, store),
        assortments: store.assortments,
        orders: store.orders,
        deliveries: store.deliveries,
        priceHistory: store.priceHistory,
        warnings: store.warnings,
      };
    },
    async queryOperations(context) {
      const { snapshot } = await access(context, true);
      await migrateLegacyAssortment(context, snapshot);
      const [warehouseOperations, store] = await Promise.all([
        warehouse.queryOperations(context),
        purchaser.load(context.projectId, context.businessEnvironmentId),
      ]);
      const needs = await buildNeeds(
        context,
        snapshot,
        purchasingWarehouseRead(warehouseOperations),
        store,
      );
      const openOrders = store.orders.filter(
        (order) =>
          order.status === 'DRAFT' ||
          order.status === 'SENT' ||
          order.status === 'PARTIALLY_DELIVERED',
      );
      const today = now().slice(0, 10);
      return {
        needs: needs.map((need) => ({
          warehouseId: need.warehouseId,
          warehouseName: need.warehouseName,
          resourceId: need.resource.resourceId,
          resourceName: need.resource.name,
          quantityBase: need.balance.quantityBase,
          baseUnit: need.resource.baseUnit,
          thresholdBase: need.thresholdBase,
          recommendedQuantityBase: need.recommendedQuantityBase,
          state: need.state,
          preferredSupplierName: need.preferredSupplier?.name ?? null,
          hasOpenOrder: openOrders.some(
            (order) =>
              order.destinationWarehouseId === need.warehouseId &&
              order.lines.some((line) => line.resourceId === need.resource.resourceId),
          ),
        })),
        orders: store.orders.map((order) => ({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          supplierName: order.supplierNameSnapshot,
          destinationWarehouseId: order.destinationWarehouseId,
          destinationWarehouseName: order.destinationWarehouseNameSnapshot,
          status: order.status,
          expectedDeliveryAt: order.expectedDeliveryAt,
          isOverdue:
            order.expectedDeliveryAt !== null &&
            order.expectedDeliveryAt < today &&
            (order.status === 'SENT' || order.status === 'PARTIALLY_DELIVERED'),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          employeeId: order.createdByEmployeeId,
          totalExpected: money(
            order.lines.reduce((sum, line) => sum + line.expectedLineTotal, 0),
          ),
          resourceNames: order.lines.map((line) => line.resourceNameSnapshot),
        })),
        deliveries: store.deliveries.map((delivery) => {
          const order = store.orders.find(
            (candidate) => candidate.orderId === delivery.supplierOrderId,
          );
          const expectedTotalForDeliveredQuantity = money(
            delivery.lines.reduce((sum, line) => {
              const orderLine = order?.lines.find(
                (candidate) => candidate.lineId === line.orderLineId,
              );
              return (
                sum +
                line.deliveredQuantityPurchaseUnit *
                  (orderLine?.expectedUnitPrice ?? line.actualUnitPrice)
              );
            }, 0),
          );
          const totalActual = money(
            delivery.lines.reduce((sum, line) => sum + line.actualLineTotal, 0),
          );
          const overdelivery = delivery.lines.some((line) => {
            const orderLine = order?.lines.find(
              (candidate) => candidate.lineId === line.orderLineId,
            );
            if (!orderLine) return false;
            const received = store.deliveries
              .filter(
                (candidate) =>
                  candidate.supplierOrderId === delivery.supplierOrderId &&
                  candidate.status === 'POSTED',
              )
              .flatMap((candidate) => candidate.lines)
              .filter((candidate) => candidate.orderLineId === line.orderLineId)
              .reduce(
                (sum, candidate) => sum + candidate.deliveredQuantityPurchaseUnit,
                0,
              );
            return received > orderLine.orderedQuantityPurchaseUnit;
          });
          return {
            deliveryId: delivery.deliveryId,
            deliveryNumber: delivery.deliveryNumber,
            supplierOrderId: delivery.supplierOrderId,
            supplierName: delivery.supplierNameSnapshot,
            destinationWarehouseId: delivery.destinationWarehouseId,
            destinationWarehouseName: delivery.destinationWarehouseNameSnapshot,
            status: delivery.status,
            supplierDocumentReference: delivery.supplierDocumentReference,
            deliveredAt: delivery.deliveredAt,
            occurredAt: delivery.postedAt ?? delivery.createdAt,
            employeeId: delivery.postedByEmployeeId ?? delivery.createdByEmployeeId,
            totalActual,
            expectedTotalForDeliveredQuantity,
            actualPriceHigher: totalActual > expectedTotalForDeliveredQuantity,
            overdelivery,
            resourceNames: delivery.lines.map((line) => line.resourceNameSnapshot),
          };
        }),
        configurationWarnings: store.warnings,
      };
    },
    async createOrder(context, input) {
      const order = await orderDocument(context, input);
      await purchaser.saveOrder(
        context.projectId,
        context.businessEnvironmentId,
        order,
      );
      return structuredClone(order);
    },
    async updateDraftOrder(context, orderId, input) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      const existing = store.orders.find((order) => order.orderId === orderId);
      if (!existing || existing.status !== 'DRAFT') throw new Error('order-immutable');
      const order = await orderDocument(context, input, existing);
      await purchaser.saveOrder(
        context.projectId,
        context.businessEnvironmentId,
        order,
      );
      return structuredClone(order);
    },
    async sendOrder(context, orderId) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      const order = store.orders.find((candidate) => candidate.orderId === orderId);
      if (!order || order.status !== 'DRAFT') throw new Error('order-immutable');
      const sent = {
        ...order,
        status: 'SENT' as const,
        sentAt: now(),
        sentByEmployeeId: context.employeeId,
        updatedAt: now(),
      };
      await purchaser.saveOrder(context.projectId, context.businessEnvironmentId, sent);
      return structuredClone(sent);
    },
    async cancelOrder(context, orderId, reason) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      const order = store.orders.find((candidate) => candidate.orderId === orderId);
      const hasPostedDelivery = store.deliveries.some(
        (delivery) =>
          delivery.supplierOrderId === orderId && delivery.status === 'POSTED',
      );
      if (
        !order ||
        order.status === 'DELIVERED' ||
        order.status === 'CANCELLED' ||
        hasPostedDelivery
      )
        throw new Error('order-immutable');
      const cancelled = {
        ...order,
        status: 'CANCELLED' as const,
        cancelledAt: now(),
        cancelledByEmployeeId: context.employeeId,
        cancellationReason: requiredText(reason, 'cancellation-reason-required'),
        updatedAt: now(),
      };
      await purchaser.saveOrder(
        context.projectId,
        context.businessEnvironmentId,
        cancelled,
      );
      return structuredClone(cancelled);
    },
    async createDeliveryDraft(context, orderId) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      const order = store.orders.find((candidate) => candidate.orderId === orderId);
      if (!order || (order.status !== 'SENT' && order.status !== 'PARTIALLY_DELIVERED'))
        throw new Error('order-not-receivable');
      const existing = store.deliveries.find(
        (delivery) =>
          delivery.supplierOrderId === orderId && delivery.status === 'DRAFT',
      );
      if (existing) return structuredClone(existing);
      const timestamp = now();
      const draft: PurchaseDelivery = {
        deliveryId: createId(),
        deliveryNumber: nextNumber(
          'ПС',
          store.deliveries.map((delivery) => delivery.deliveryNumber),
        ),
        supplierOrderId: order.orderId,
        supplierId: order.supplierId,
        supplierNameSnapshot: order.supplierNameSnapshot,
        destinationWarehouseId: order.destinationWarehouseId,
        destinationWarehouseNameSnapshot: order.destinationWarehouseNameSnapshot,
        status: 'DRAFT',
        supplierDocumentReference: '',
        deliveredAt: timestamp.slice(0, 10),
        createdAt: timestamp,
        createdByEmployeeId: context.employeeId,
        postedAt: null,
        postedByEmployeeId: null,
        comment: '',
        lines: [],
      };
      await purchaser.saveDelivery(
        context.projectId,
        context.businessEnvironmentId,
        draft,
      );
      return structuredClone(draft);
    },
    async postDelivery(context, deliveryId, input) {
      const { snapshot, store } = await operationalState(context);
      const draft = store.deliveries.find(
        (candidate) => candidate.deliveryId === deliveryId,
      );
      if (!draft || draft.status !== 'DRAFT') throw new Error('delivery-immutable');
      const order = store.orders.find(
        (candidate) => candidate.orderId === draft.supplierOrderId,
      );
      if (!order || (order.status !== 'SENT' && order.status !== 'PARTIALLY_DELIVERED'))
        throw new Error('order-not-receivable');
      const previouslyReceived = new Map<string, number>();
      for (const delivery of store.deliveries.filter(
        (candidate) =>
          candidate.supplierOrderId === order.orderId && candidate.status === 'POSTED',
      )) {
        for (const line of delivery.lines) {
          previouslyReceived.set(
            line.orderLineId,
            (previouslyReceived.get(line.orderLineId) ?? 0) +
              line.deliveredQuantityPurchaseUnit,
          );
        }
      }
      const deliveryLines: PurchaseDeliveryLine[] = input.lines
        .filter((line) => line.quantityPurchaseUnit > 0)
        .map((inputLine) => {
          const orderLine = order.lines.find(
            (candidate) => candidate.lineId === inputLine.orderLineId,
          );
          if (!orderLine) throw new Error('order-line-not-found');
          if (
            !Number.isFinite(inputLine.quantityPurchaseUnit) ||
            !Number.isFinite(inputLine.actualUnitPrice) ||
            inputLine.actualUnitPrice < 0
          )
            throw new Error('invalid-delivery-line');
          const remaining =
            orderLine.orderedQuantityPurchaseUnit -
            (previouslyReceived.get(orderLine.lineId) ?? 0);
          if (inputLine.quantityPurchaseUnit > remaining && !input.confirmOverdelivery)
            throw new Error('overdelivery-confirmation-required');
          return {
            lineId: createId(),
            orderLineId: orderLine.lineId,
            resourceId: orderLine.resourceId,
            resourceType: orderLine.resourceType,
            resourceNameSnapshot: orderLine.resourceNameSnapshot,
            purchaseUnitId: orderLine.purchaseUnitId,
            purchaseUnitNameSnapshot: orderLine.purchaseUnitNameSnapshot,
            packageSizeSnapshot: orderLine.packageSizeSnapshot,
            baseUnit: orderLine.baseUnit,
            deliveredQuantityPurchaseUnit: inputLine.quantityPurchaseUnit,
            deliveredQuantityBase: round(
              inputLine.quantityPurchaseUnit * orderLine.packageSizeSnapshot,
            ),
            actualUnitPrice: money(inputLine.actualUnitPrice),
            actualLineTotal: money(
              inputLine.quantityPurchaseUnit * inputLine.actualUnitPrice,
            ),
          };
        });
      if (deliveryLines.length === 0) throw new Error('delivery-empty');
      const timestamp = now();
      const posted: PurchaseDelivery = {
        ...draft,
        status: 'POSTED',
        supplierDocumentReference: requiredText(
          input.supplierDocumentReference,
          'supplier-document-required',
        ),
        deliveredAt: input.deliveredAt || timestamp.slice(0, 10),
        postedAt: timestamp,
        postedByEmployeeId: context.employeeId,
        comment: input.comment?.trim() ?? '',
        lines: deliveryLines,
      };
      const receipt: WarehouseSupplierReceiptInput = {
        deliveryId: posted.deliveryId,
        supplierOrderId: order.orderNumber,
        destinationWarehouseId: posted.destinationWarehouseId,
        supplierDocumentReference: posted.supplierDocumentReference,
        lines: posted.lines.map((line) => ({
          deliveryLineId: line.lineId,
          resourceId: line.resourceId,
          resourceType: line.resourceType,
          resourceName: line.resourceNameSnapshot,
          quantityBase: line.deliveredQuantityBase,
          baseUnit: line.baseUnit,
        })),
      };
      await warehouse.recordSupplierDelivery(context, receipt);
      const totals = new Map(previouslyReceived);
      for (const line of posted.lines) {
        totals.set(
          line.orderLineId,
          (totals.get(line.orderLineId) ?? 0) + line.deliveredQuantityPurchaseUnit,
        );
      }
      const complete = order.lines.every(
        (line) => (totals.get(line.lineId) ?? 0) >= line.orderedQuantityPurchaseUnit,
      );
      const updatedOrder = {
        ...order,
        status: complete ? ('DELIVERED' as const) : ('PARTIALLY_DELIVERED' as const),
        updatedAt: timestamp,
      };
      const currency = snapshot.businessProfile.defaultCurrency;
      const priceEntries: PurchasePriceHistoryEntry[] = posted.lines.map((line) => ({
        priceHistoryId: `price:${posted.deliveryId}:${line.lineId}`,
        deliveryId: posted.deliveryId,
        supplierId: posted.supplierId,
        supplierNameSnapshot: posted.supplierNameSnapshot,
        resourceId: line.resourceId,
        resourceType: line.resourceType,
        resourceNameSnapshot: line.resourceNameSnapshot,
        purchaseUnitId: line.purchaseUnitId,
        purchaseUnitNameSnapshot: line.purchaseUnitNameSnapshot,
        packageSizeSnapshot: line.packageSizeSnapshot,
        actualUnitPrice: line.actualUnitPrice,
        baseUnitPrice: money(line.actualUnitPrice / line.packageSizeSnapshot),
        currency,
        recordedAt: timestamp,
      }));
      const assortmentUpdates: SupplierAssortment[] = posted.lines.map((line) => {
        const existing = store.assortments.find(
          (item) =>
            item.supplierId === posted.supplierId &&
            item.resourceId === line.resourceId,
        );
        return {
          assortmentId:
            existing?.assortmentId ??
            `delivery:${posted.supplierId}:${line.resourceId}`,
          supplierId: posted.supplierId,
          resourceId: line.resourceId,
          resourceType: line.resourceType,
          supplierProductName: existing?.supplierProductName ?? null,
          supplierSku: existing?.supplierSku ?? null,
          purchaseUnitId: line.purchaseUnitId,
          purchaseUnitName: line.purchaseUnitNameSnapshot,
          packageSize: line.packageSizeSnapshot,
          lastKnownPrice: line.actualUnitPrice,
          currency,
          preferred: existing?.preferred ?? false,
          status: existing?.status ?? 'active',
          updatedAt: timestamp,
        };
      });
      await purchaser.commitPostedDelivery(
        context.projectId,
        context.businessEnvironmentId,
        {
          delivery: posted,
          order: updatedOrder,
          priceEntries,
          assortmentUpdates,
        },
      );
      return structuredClone(posted);
    },
    async cancelDelivery(context, deliveryId) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      const delivery = store.deliveries.find(
        (candidate) => candidate.deliveryId === deliveryId,
      );
      if (!delivery || delivery.status !== 'DRAFT')
        throw new Error('delivery-immutable');
      const cancelled = { ...delivery, status: 'CANCELLED' as const };
      await purchaser.saveDelivery(
        context.projectId,
        context.businessEnvironmentId,
        cancelled,
      );
      return structuredClone(cancelled);
    },
    async saveSupplier(context, supplierId, input) {
      await access(context);
      const payload = {
        name: requiredText(input.name, 'supplier-name-required'),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        address: '',
        taxIdentifier: '',
        paymentTerms: '',
        deliverySchedule: '',
        suppliedIngredients: '',
        comment: input.comment.trim(),
        status: input.status,
      };
      if (supplierId) await suppliers.update(context.projectId, supplierId, payload);
      else await suppliers.create(context.projectId, payload);
    },
    async deleteSupplier(context, supplierId) {
      await access(context);
      const store = await purchaser.load(
        context.projectId,
        context.businessEnvironmentId,
      );
      if (
        store.orders.some((order) => order.supplierId === supplierId) ||
        store.deliveries.some((delivery) => delivery.supplierId === supplierId) ||
        store.assortments.some((item) => item.supplierId === supplierId)
      )
        throw new Error('supplier-in-use');
      await suppliers.remove(context.projectId, supplierId);
    },
    async saveAssortment(context, assortmentId, input) {
      const { snapshot, warehouseState, store } = await operationalState(context);
      const supplier = snapshot.suppliers.find(
        (candidate) => candidate.id === input.supplierId,
      );
      const resource = activePurchasableResources(warehouseState).find(
        (candidate) => candidate.resourceId === input.resourceId,
      );
      if (!supplier || !resource) throw new Error('configuration-not-found');
      if (
        input.lastKnownPrice !== null &&
        input.lastKnownPrice !== undefined &&
        (!Number.isFinite(input.lastKnownPrice) || input.lastKnownPrice < 0)
      )
        throw new Error('invalid-price');
      const targetAssortmentId =
        assortmentId ??
        store.assortments.find(
          (candidate) =>
            candidate.supplierId === supplier.id &&
            candidate.resourceId === resource.resourceId,
        )?.assortmentId ??
        createId();
      if (input.preferred) {
        for (const item of store.assortments.filter(
          (candidate) =>
            candidate.resourceId === resource.resourceId &&
            candidate.preferred &&
            candidate.assortmentId !== targetAssortmentId,
        )) {
          await purchaser.saveAssortment(
            context.projectId,
            context.businessEnvironmentId,
            { ...item, preferred: false, updatedAt: now() },
          );
        }
      }
      await purchaser.saveAssortment(context.projectId, context.businessEnvironmentId, {
        assortmentId: targetAssortmentId,
        supplierId: supplier.id,
        resourceId: resource.resourceId,
        resourceType: resource.resourceType,
        supplierProductName: input.supplierProductName?.trim() || null,
        supplierSku: input.supplierSku?.trim() || null,
        purchaseUnitId: resource.purchaseUnitId,
        purchaseUnitName:
          snapshot.units.find((unit) => unit.id === resource.purchaseUnitId)?.name ??
          'Единица закупки',
        packageSize: resource.purchasePackageSize,
        lastKnownPrice:
          input.lastKnownPrice === null || input.lastKnownPrice === undefined
            ? null
            : money(input.lastKnownPrice),
        currency: snapshot.businessProfile.defaultCurrency,
        preferred: input.preferred,
        status: input.active ? 'active' : 'inactive',
        updatedAt: now(),
      });
    },
    async removeAssortment(context, assortmentId) {
      await access(context);
      await purchaser.removeAssortment(
        context.projectId,
        context.businessEnvironmentId,
        assortmentId,
      );
    },
    subscribe: (context, listener) => purchaser.subscribe(context.projectId, listener),
  };
}

export const localCoffeePurchaserService = createCoffeePurchaserService({
  operational: localCoffeeOperationalReadRepository,
  purchaser: localCoffeePurchaserRepository,
  warehouse: localCoffeeWarehouseService,
  suppliers: localCoffeeManagerRepositories.suppliers,
});
