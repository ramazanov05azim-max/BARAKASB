'use client';

import type {
  CoffeeBarAuditEntry,
  CoffeeBarStore,
  CoffeeOrder,
  CoffeeOrderItem,
} from './bar-domain';
import type { CoffeeBarOrderRepository } from './bar-repository-contracts';

export const coffeeBarOrderStoragePrefix = 'barakasb.mock.coffee.bar-orders.v1';
const sameTabEvent = 'barakasb:coffee-bar-orders-changed';

function key(projectId: string): string {
  return `${coffeeBarOrderStoragePrefix}.${encodeURIComponent(projectId)}`;
}

function emptyStore(): CoffeeBarStore {
  return { orders: [], audit: [] };
}

function browserStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('coffee-bar-local-repository-browser-only');
  }
  return window.localStorage;
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeItem(value: unknown, legacyBatchId: string): CoffeeOrderItem {
  const item = objectValue(value);
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
  const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
  const modifierPrice = modifiers.reduce((sum, modifier) => {
    const record = objectValue(modifier);
    return (
      sum + (typeof record.priceAdjustment === 'number' ? record.priceAdjustment : 0)
    );
  }, 0);
  const status = typeof item.status === 'string' ? item.status : 'DRAFT';
  const submitted = status !== 'DRAFT';
  return {
    id: String(item.id ?? ''),
    productId: String(item.productId ?? ''),
    productName: String(item.productName ?? ''),
    variantName: typeof item.variantName === 'string' ? item.variantName : null,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    unitPrice,
    finalUnitPrice:
      typeof item.finalUnitPrice === 'number'
        ? item.finalUnitPrice
        : unitPrice + modifierPrice,
    modifiers: modifiers as CoffeeOrderItem['modifiers'],
    comment: typeof item.comment === 'string' ? item.comment : '',
    preparationWorkspace:
      item.preparationWorkspace === 'KITCHEN' ||
      item.preparationWorkspace === 'IMMEDIATE'
        ? item.preparationWorkspace
        : 'BAR',
    status:
      status === 'NEW' ||
      status === 'ACCEPTED' ||
      status === 'PREPARING' ||
      status === 'READY' ||
      status === 'CANCELLED'
        ? status
        : 'DRAFT',
    submittedBatchId:
      typeof item.submittedBatchId === 'string'
        ? item.submittedBatchId
        : submitted
          ? legacyBatchId
          : null,
  };
}

function normalizeOrder(value: unknown): CoffeeOrder {
  const order = objectValue(value);
  const orderId = String(order.orderId ?? '');
  const updatedAt = String(
    order.updatedAt ?? order.createdAt ?? new Date(0).toISOString(),
  );
  const legacyBatchId = `legacy-${orderId}`;
  const items = Array.isArray(order.items)
    ? order.items.map((item) => normalizeItem(item, legacyBatchId))
    : [];
  const hasSubmitted = items.some((item) => item.submittedBatchId);
  const oldPayment = order.paymentStatus;
  const isPaid =
    oldPayment === 'PAID' || oldPayment === 'CASH' || oldPayment === 'CARD';
  const oldStatus = order.status;
  const status =
    oldStatus === 'ISSUED'
      ? 'COMPLETED'
      : oldStatus === 'SENT' ||
          oldStatus === 'IN_PREPARATION' ||
          oldStatus === 'READY' ||
          oldStatus === 'COMPLETED' ||
          oldStatus === 'CANCELLED'
        ? oldStatus
        : 'DRAFT';
  return {
    orderId,
    projectId: String(order.projectId ?? ''),
    businessEnvironmentId: String(order.businessEnvironmentId ?? ''),
    workspaceId: String(order.workspaceId ?? ''),
    locationId: String(order.locationId ?? ''),
    orderType:
      order.orderType === 'TABLE' ||
      order.orderType === 'UNASSIGNED' ||
      order.orderType === 'DELIVERY'
        ? order.orderType
        : 'TAKEAWAY',
    tableId: typeof order.tableId === 'string' ? order.tableId : null,
    orderNumber: String(order.orderNumber ?? ''),
    status,
    guestCount: typeof order.guestCount === 'number' ? order.guestCount : 1,
    seatingNote: typeof order.seatingNote === 'string' ? order.seatingNote : '',
    openedAt: String(order.openedAt ?? order.createdAt ?? updatedAt),
    openedByEmployeeId: String(
      order.openedByEmployeeId ?? order.createdByEmployeeId ?? '',
    ),
    createdAt: String(order.createdAt ?? updatedAt),
    createdByEmployeeId: String(order.createdByEmployeeId ?? ''),
    paymentStatus: isPaid ? 'PAID' : 'UNPAID',
    paymentMethod:
      oldPayment === 'CASH' || oldPayment === 'CARD'
        ? oldPayment
        : order.paymentMethod === 'CASH' || order.paymentMethod === 'CARD'
          ? order.paymentMethod
          : null,
    paidAmount: isPaid && typeof order.total === 'number' ? order.total : null,
    paidAt: isPaid ? String(order.paidAt ?? updatedAt) : null,
    paidByEmployeeId: isPaid
      ? String(order.paidByEmployeeId ?? order.createdByEmployeeId ?? '')
      : null,
    total: typeof order.total === 'number' ? order.total : 0,
    issuedAt: typeof order.issuedAt === 'string' ? order.issuedAt : null,
    completedAt:
      status === 'COMPLETED'
        ? String(order.completedAt ?? order.issuedAt ?? updatedAt)
        : null,
    completedByEmployeeId:
      status === 'COMPLETED'
        ? String(order.completedByEmployeeId ?? order.createdByEmployeeId ?? '')
        : null,
    cancellationReason:
      typeof order.cancellationReason === 'string' ? order.cancellationReason : null,
    updatedAt,
    items,
    batches: Array.isArray(order.batches)
      ? (order.batches as CoffeeOrder['batches'])
      : hasSubmitted
        ? [
            {
              batchId: legacyBatchId,
              orderId,
              createdAt: String(order.createdAt ?? updatedAt),
              createdByEmployeeId: String(order.createdByEmployeeId ?? ''),
              itemIds: items
                .filter((item) => item.submittedBatchId)
                .map((item) => item.id),
              sentAt: updatedAt,
              status: 'SENT',
            },
          ]
        : [],
  };
}

function normalizeAudit(value: unknown): CoffeeBarAuditEntry | null {
  const entry = objectValue(value);
  if (!entry.id || !entry.orderId) return null;
  const operation =
    entry.operation === 'ORDER_SENT'
      ? 'BATCH_SENT'
      : entry.operation === 'ORDER_ISSUED'
        ? 'ORDER_COMPLETED'
        : entry.operation;
  const supported: ReadonlyArray<CoffeeBarAuditEntry['operation']> = [
    'ORDER_CREATED',
    'ORDER_ASSIGNED',
    'GUEST_COUNT_CHANGED',
    'ORDER_TRANSFERRED',
    'ORDER_RELEASED',
    'BATCH_SENT',
    'ITEM_STATUS_CHANGED',
    'PAYMENT_RECORDED',
    'ORDER_COMPLETED',
    'ORDER_CANCELLED',
  ];
  if (!supported.includes(operation as CoffeeBarAuditEntry['operation'])) return null;
  return {
    id: String(entry.id),
    projectId: String(entry.projectId ?? ''),
    businessEnvironmentId: String(entry.businessEnvironmentId ?? ''),
    orderId: String(entry.orderId),
    employeeId: String(entry.employeeId ?? ''),
    operation: operation as CoffeeBarAuditEntry['operation'],
    occurredAt: String(entry.occurredAt ?? new Date(0).toISOString()),
    detail: typeof entry.detail === 'string' ? entry.detail : null,
  };
}

function read(storage: Storage, projectId: string): CoffeeBarStore {
  const stored = storage.getItem(key(projectId));
  if (!stored) return emptyStore();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('orders' in parsed) ||
      !Array.isArray(parsed.orders) ||
      !('audit' in parsed) ||
      !Array.isArray(parsed.audit)
    ) {
      return emptyStore();
    }
    return {
      orders: parsed.orders.map(normalizeOrder),
      audit: parsed.audit
        .map(normalizeAudit)
        .filter((entry): entry is CoffeeBarAuditEntry => entry !== null),
    };
  } catch {
    return emptyStore();
  }
}

export function createLocalCoffeeBarOrderRepository(
  storage: Storage,
  eventTarget?: Pick<
    Window,
    'addEventListener' | 'removeEventListener' | 'dispatchEvent'
  >,
): CoffeeBarOrderRepository {
  return {
    async load(projectId) {
      return structuredClone(read(storage, projectId));
    },
    async save(projectId, store) {
      storage.setItem(key(projectId), JSON.stringify(store));
      eventTarget?.dispatchEvent(
        new CustomEvent(sameTabEvent, { detail: { projectId } }),
      );
    },
    subscribe(projectId, listener) {
      if (!eventTarget) return () => undefined;
      const handleStorage = (event: Event): void => {
        if (event instanceof StorageEvent && event.key !== key(projectId)) {
          return;
        }
        if (
          event instanceof CustomEvent &&
          event.type === sameTabEvent &&
          (event.detail as { projectId?: string } | null)?.projectId !== projectId
        ) {
          return;
        }
        listener();
      };
      eventTarget.addEventListener('storage', handleStorage);
      eventTarget.addEventListener(sameTabEvent, handleStorage);
      return () => {
        eventTarget.removeEventListener('storage', handleStorage);
        eventTarget.removeEventListener(sameTabEvent, handleStorage);
      };
    },
    async remove(projectId) {
      storage.removeItem(key(projectId));
      eventTarget?.dispatchEvent(
        new CustomEvent(sameTabEvent, { detail: { projectId } }),
      );
    },
  };
}

export const localCoffeeBarOrderRepository: CoffeeBarOrderRepository = {
  load: (projectId) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).load(projectId),
  save: (projectId, store) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).save(
      projectId,
      store,
    ),
  subscribe: (projectId, listener) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).subscribe(
      projectId,
      listener,
    ),
  remove: (projectId) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).remove(projectId),
};
