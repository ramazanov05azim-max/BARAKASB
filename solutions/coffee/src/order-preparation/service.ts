'use client';

import type {
  CoffeeBarAuditEntry,
  CoffeeBarStore,
  CoffeeOrder,
  CoffeeOrderItem,
} from '../bar-domain';
import { localCoffeeBarOrderRepository } from '../bar-local-repository';
import type { CoffeeBarOrderRepository } from '../bar-repository-contracts';
import { localCoffeeOperationalReadRepository } from '../repositories';
import type { CoffeeOperationalReadRepository } from '../repository-contracts';
import {
  PreparationOperationError,
  type PreparationQueueReadModel,
  type PreparationRuntimeContext,
  type PreparationService,
  type PreparationTicketView,
} from './contracts';

interface Dependencies {
  readonly operational: CoffeeOperationalReadRepository;
  readonly orders: CoffeeBarOrderRepository;
  readonly now?: () => string;
  readonly createId?: () => string;
}

type Snapshot = Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>;

function activeOrder(order: CoffeeOrder): boolean {
  return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
}

function preparationStatus(order: CoffeeOrder): CoffeeOrder['status'] {
  const submitted = order.items.filter((item) => item.submittedBatchId);
  if (submitted.length === 0) return 'DRAFT';
  if (submitted.every((item) => item.status === 'READY')) return 'READY';
  if (submitted.some((item) => item.status === 'PREPARING')) return 'IN_PREPARATION';
  return 'SENT';
}

function kitchenItems(order: CoffeeOrder): ReadonlyArray<CoffeeOrderItem> {
  return order.items.filter(
    (item) =>
      item.preparationWorkspace === 'KITCHEN' &&
      item.submittedBatchId !== null &&
      item.status !== 'DRAFT' &&
      item.status !== 'CANCELLED',
  );
}

function assertOrderScope(
  context: PreparationRuntimeContext,
  order: CoffeeOrder,
): void {
  if (
    order.projectId !== context.projectId ||
    order.businessEnvironmentId !== context.businessEnvironmentId
  ) {
    throw new PreparationOperationError('ACCESS_DENIED');
  }
}

function orderById(store: CoffeeBarStore, orderId: string): CoffeeOrder {
  const order = store.orders.find((candidate) => candidate.orderId === orderId);
  if (!order) throw new PreparationOperationError('NOT_FOUND');
  return order;
}

function employeeName(snapshot: Snapshot, employeeId: string | null): string | null {
  if (!employeeId) return null;
  return (
    snapshot.employees.find((employee) => employee.id === employeeId)?.fullName ?? null
  );
}

function sentAt(order: CoffeeOrder, item: CoffeeOrderItem): string {
  return (
    order.batches.find((batch) => batch.batchId === item.submittedBatchId)?.sentAt ??
    order.updatedAt
  );
}

function toTicket(
  snapshot: Snapshot,
  store: CoffeeBarStore,
  order: CoffeeOrder,
): PreparationTicketView | null {
  const positions = kitchenItems(order);
  if (positions.length === 0) return null;
  const sentTimes = positions.map((item) => sentAt(order, item)).sort();
  const firstSentAt = sentTimes[0] ?? order.updatedAt;
  const confirmation = store.audit.find(
    (entry) => entry.orderId === order.orderId && entry.operation === 'READY_ALL',
  );
  const table = order.tableId
    ? snapshot.tables.find((candidate) => candidate.id === order.tableId)
    : null;
  const responsibleNames = (item: CoffeeOrderItem): ReadonlyArray<string> => {
    const ids = [item.preparationStartedByEmployeeId, item.readyByEmployeeId].filter(
      (id): id is string => Boolean(id),
    );
    return [...new Set(ids)]
      .map((id) => employeeName(snapshot, id))
      .filter((name): name is string => Boolean(name));
  };
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    destination:
      order.orderType === 'TABLE' && table
        ? table.name.startsWith('Стол')
          ? table.name
          : `Стол ${table.name}`
        : order.orderType === 'DELIVERY'
          ? 'Доставка'
          : 'Навынос',
    sentByEmployeeName: employeeName(snapshot, order.createdByEmployeeId),
    sentAt: firstSentAt,
    orderActive: activeOrder(order),
    completionConfirmed: Boolean(confirmation),
    positions: positions.map((item) => ({
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      modifiers: item.modifiers
        .filter((modifier) => {
          const group = snapshot.modifiers.find(
            (candidate) => candidate.id === modifier.modifierGroupId,
          );
          return (
            !group?.preparationVisibility ||
            group.preparationVisibility === 'all' ||
            group.preparationVisibility === 'kitchen'
          );
        })
        .map((modifier) => ({
          groupName: modifier.modifierName,
          optionName: modifier.optionName,
        })),
      comment: item.comment,
      status: item.status as 'NEW' | 'PREPARING' | 'READY',
      sentAt: sentAt(order, item),
      preparationStartedAt: item.preparationStartedAt ?? null,
      readyAt: item.readyAt ?? null,
      responsibleEmployeeNames: responsibleNames(item),
    })),
  };
}

export function createCoffeePreparationService({
  operational,
  orders,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): PreparationService {
  async function access(
    context: PreparationRuntimeContext,
    write: boolean,
  ): Promise<{
    snapshot: Snapshot;
    workspace: Snapshot['solutionStructure']['workspaces'][number];
  }> {
    if (
      !context.projectId ||
      !context.businessEnvironmentId ||
      !context.workspaceId ||
      !context.employeeId
    ) {
      throw new PreparationOperationError('ACCESS_DENIED');
    }
    if (write && context.employeeId === 'owner-preview') {
      throw new PreparationOperationError('READ_ONLY_PREVIEW');
    }
    const snapshot = await operational.load(context.projectId);
    const workspace = snapshot.solutionStructure.workspaces.find(
      (candidate) =>
        candidate.id === context.workspaceId && candidate.moduleId === 'kitchen',
    );
    const employee = snapshot.employees.find(
      (candidate) =>
        candidate.id === context.employeeId &&
        candidate.status === 'active' &&
        candidate.employmentStatus === 'active',
    );
    if (
      !workspace ||
      (context.employeeId !== 'owner-preview' &&
        (!employee || !workspace.assignedEmployeeIds.includes(employee.id)))
    ) {
      throw new PreparationOperationError('ACCESS_DENIED');
    }
    return { snapshot, workspace };
  }

  function audit(
    context: PreparationRuntimeContext,
    orderId: string,
    operation: CoffeeBarAuditEntry['operation'],
    detail: string,
    occurredAt: string,
  ): CoffeeBarAuditEntry {
    return {
      id: createId(),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      workspaceId: context.workspaceId,
      orderId,
      employeeId: context.employeeId,
      operation,
      occurredAt,
      detail,
    };
  }

  async function change(
    context: PreparationRuntimeContext,
    orderId: string,
    operation: 'ACCEPT_POSITION' | 'READY_POSITION' | 'ACCEPT_ALL',
    transform: (order: CoffeeOrder, timestamp: string) => CoffeeOrder | null,
  ): Promise<void> {
    await access(context, true);
    const store = await orders.load(context.projectId);
    const order = orderById(store, orderId);
    assertOrderScope(context, order);
    if (!activeOrder(order)) throw new PreparationOperationError('ORDER_INACTIVE');
    const timestamp = now();
    const changed = transform(order, timestamp);
    if (!changed) return;
    await orders.save(context.projectId, {
      orders: store.orders.map((candidate) =>
        candidate.orderId === orderId
          ? { ...changed, status: preparationStatus(changed), updatedAt: timestamp }
          : candidate,
      ),
      audit: [
        audit(
          context,
          orderId,
          operation,
          operation === 'ACCEPT_ALL'
            ? kitchenItems(order)
                .filter((item) => item.status === 'NEW')
                .map((item) => item.id)
                .join(',')
            : kitchenItems(changed)
                .filter((item) =>
                  operation === 'ACCEPT_POSITION'
                    ? item.preparationStartedAt === timestamp
                    : item.readyAt === timestamp,
                )
                .map((item) => item.id)
                .join(','),
          timestamp,
        ),
        ...store.audit,
      ].slice(0, 500),
    });
  }

  return {
    async loadKitchenQueue(context): Promise<PreparationQueueReadModel> {
      const { snapshot, workspace } = await access(context, false);
      const store = await orders.load(context.projectId);
      const location = workspace.locationId
        ? snapshot.locations.find((item) => item.id === workspace.locationId)
        : null;
      const sourceWarehouse = workspace.sourceWarehouseId
        ? snapshot.warehouses.find(
            (item) =>
              item.id === workspace.sourceWarehouseId && item.status === 'active',
          )
        : null;
      return {
        locationName: location?.name ?? null,
        sourceWarehouseName: sourceWarehouse?.name ?? null,
        sourceWarehouseConfigured: Boolean(sourceWarehouse),
        timing: workspace.preparationTiming ?? null,
        tickets: store.orders
          .filter(
            (order) =>
              order.projectId === context.projectId &&
              order.businessEnvironmentId === context.businessEnvironmentId,
          )
          .map((order) => toTicket(snapshot, store, order))
          .filter((ticket): ticket is PreparationTicketView => Boolean(ticket))
          .sort((left, right) => left.sentAt.localeCompare(right.sentAt)),
      };
    },
    subscribe: (context, listener) => orders.subscribe(context.projectId, listener),
    async acceptPosition(context, orderId, orderItemId) {
      await change(context, orderId, 'ACCEPT_POSITION', (order, timestamp) => {
        const item = kitchenItems(order).find(
          (candidate) => candidate.id === orderItemId,
        );
        if (!item) throw new PreparationOperationError('NOT_FOUND');
        if (item.status === 'PREPARING' || item.status === 'READY') return null;
        if (item.status !== 'NEW')
          throw new PreparationOperationError('INVALID_TRANSITION');
        return {
          ...order,
          items: order.items.map((candidate) =>
            candidate.id === orderItemId
              ? {
                  ...candidate,
                  status: 'PREPARING' as const,
                  preparationStartedAt: timestamp,
                  preparationStartedByEmployeeId: context.employeeId,
                }
              : candidate,
          ),
        };
      });
    },
    async markPositionReady(context, orderId, orderItemId) {
      await change(context, orderId, 'READY_POSITION', (order, timestamp) => {
        const item = kitchenItems(order).find(
          (candidate) => candidate.id === orderItemId,
        );
        if (!item) throw new PreparationOperationError('NOT_FOUND');
        if (item.status === 'READY') return null;
        if (item.status !== 'PREPARING')
          throw new PreparationOperationError('INVALID_TRANSITION');
        return {
          ...order,
          items: order.items.map((candidate) =>
            candidate.id === orderItemId
              ? {
                  ...candidate,
                  status: 'READY' as const,
                  readyAt: timestamp,
                  readyByEmployeeId: context.employeeId,
                }
              : candidate,
          ),
        };
      });
    },
    async acceptAll(context, orderId) {
      await change(context, orderId, 'ACCEPT_ALL', (order, timestamp) => {
        const ids = new Set(
          kitchenItems(order)
            .filter((item) => item.status === 'NEW')
            .map((item) => item.id),
        );
        if (ids.size === 0) return null;
        return {
          ...order,
          items: order.items.map((item) =>
            ids.has(item.id)
              ? {
                  ...item,
                  status: 'PREPARING' as const,
                  preparationStartedAt: timestamp,
                  preparationStartedByEmployeeId: context.employeeId,
                }
              : item,
          ),
        };
      });
    },
    async confirmAllReady(context, orderId) {
      await access(context, true);
      const store = await orders.load(context.projectId);
      const order = orderById(store, orderId);
      assertOrderScope(context, order);
      if (!activeOrder(order)) throw new PreparationOperationError('ORDER_INACTIVE');
      const items = kitchenItems(order);
      if (!items.length || items.some((item) => item.status !== 'READY')) {
        throw new PreparationOperationError('NOT_ALL_READY');
      }
      if (
        store.audit.some(
          (entry) => entry.orderId === orderId && entry.operation === 'READY_ALL',
        )
      ) {
        return;
      }
      const timestamp = now();
      await orders.save(context.projectId, {
        ...store,
        audit: [
          audit(
            context,
            orderId,
            'READY_ALL',
            items.map((item) => item.id).join(','),
            timestamp,
          ),
          ...store.audit,
        ].slice(0, 500),
      });
    },
  };
}

export const localCoffeePreparationService = createCoffeePreparationService({
  operational: localCoffeeOperationalReadRepository,
  orders: localCoffeeBarOrderRepository,
});
