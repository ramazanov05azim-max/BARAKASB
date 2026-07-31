import type {
  CoffeeBarAuditEntry,
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeBarStore,
  CoffeeOrder,
  CoffeeOrderItem,
  CoffeeOrderItemDraftInput,
  CoffeeOrderItemStatus,
  CoffeePaymentStatus,
  CoffeePreparationWorkspace,
} from './bar-domain';
import {
  CoffeeBarOperationError,
  type CoffeeBarOrderRepository,
} from './bar-repository-contracts';
import type { CoffeeOperationalReadRepository } from './repository-contracts';

export interface CoffeeBarService {
  load(context: CoffeeBarRuntimeContext): Promise<CoffeeBarState>;
  createTableOrder(
    context: CoffeeBarRuntimeContext,
    tableId: string,
  ): Promise<CoffeeOrder>;
  createTakeawayOrder(context: CoffeeBarRuntimeContext): Promise<CoffeeOrder>;
  addItem(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    input: CoffeeOrderItemDraftInput,
  ): Promise<CoffeeOrder>;
  updateItemQuantity(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    itemId: string,
    quantity: number,
  ): Promise<CoffeeOrder>;
  updateItemDetails(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    itemId: string,
    input: Pick<CoffeeOrderItemDraftInput, 'modifiers' | 'comment'>,
  ): Promise<CoffeeOrder>;
  removeItem(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    itemId: string,
  ): Promise<CoffeeOrder>;
  sendOrder(context: CoffeeBarRuntimeContext, orderId: string): Promise<CoffeeOrder>;
  updateBarItemStatus(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    itemId: string,
    status: Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'>,
  ): Promise<CoffeeOrder>;
  setPayment(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    status: CoffeePaymentStatus,
  ): Promise<CoffeeOrder>;
  issueOrder(context: CoffeeBarRuntimeContext, orderId: string): Promise<CoffeeOrder>;
  cancelOrder(context: CoffeeBarRuntimeContext, orderId: string): Promise<CoffeeOrder>;
  subscribe(context: CoffeeBarRuntimeContext, listener: () => void): () => void;
}

interface Dependencies {
  operational: CoffeeOperationalReadRepository;
  orders: CoffeeBarOrderRepository;
  now?: () => string;
  createId?: () => string;
}

type OperationalSnapshot = Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>;

const terminalStatuses = new Set<CoffeeOrder['status']>(['ISSUED', 'CANCELLED']);

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function itemTotal(item: CoffeeOrderItem): number {
  const modifierTotal = item.modifiers.reduce(
    (sum, modifier) => sum + modifier.priceAdjustment,
    0,
  );
  return money((item.unitPrice + modifierTotal) * item.quantity);
}

function withTotal(order: CoffeeOrder): CoffeeOrder {
  return {
    ...order,
    total: money(order.items.reduce((sum, item) => sum + itemTotal(item), 0)),
  };
}

function statusAfterPreparation(order: CoffeeOrder): CoffeeOrder['status'] {
  if (order.items.length > 0 && order.items.every((item) => item.status === 'READY')) {
    return 'READY';
  }
  if (
    order.items.some(
      (item) => item.status === 'ACCEPTED' || item.status === 'PREPARING',
    )
  ) {
    return 'IN_PREPARATION';
  }
  return 'SENT';
}

function parsePriceAdjustment(optionName: string): number {
  const match = optionName.match(/\+\s*(\d+(?:[.,]\d+)?)/u);
  return match ? Number.parseFloat(match[1]?.replace(',', '.') ?? '0') : 0;
}

function parseModifierOptions(options: string): ReadonlyArray<{
  name: string;
  priceAdjustment: number;
}> {
  return options
    .split(';')
    .map((option) => option.trim())
    .filter(Boolean)
    .map((name) => ({ name, priceAdjustment: parsePriceAdjustment(name) }));
}

function preparationWorkspace(
  snapshot: OperationalSnapshot,
  productId: string,
): CoffeePreparationWorkspace {
  const item = snapshot.menuItems.find((candidate) => candidate.id === productId);
  if (!item) throw new CoffeeBarOperationError('NOT_FOUND');
  if (!item.recipeId) return 'IMMEDIATE';
  return item.preparationLocationId &&
    item.preparationLocationId !== snapshot.project.defaultLocationId
    ? 'KITCHEN'
    : 'BAR';
}

function findOrder(store: CoffeeBarStore, orderId: string): CoffeeOrder {
  const order = store.orders.find((candidate) => candidate.orderId === orderId);
  if (!order) throw new CoffeeBarOperationError('NOT_FOUND');
  return order;
}

function replaceOrder(store: CoffeeBarStore, order: CoffeeOrder): CoffeeBarStore {
  return {
    ...store,
    orders: store.orders.map((candidate) =>
      candidate.orderId === order.orderId ? order : candidate,
    ),
  };
}

function audit(store: CoffeeBarStore, entry: CoffeeBarAuditEntry): CoffeeBarStore {
  return { ...store, audit: [entry, ...store.audit].slice(0, 500) };
}

function ensureDraft(order: CoffeeOrder): void {
  if (order.status !== 'DRAFT') {
    throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
  }
}

function ensureContextOrder(
  context: CoffeeBarRuntimeContext,
  order: CoffeeOrder,
): void {
  if (
    order.projectId !== context.projectId ||
    order.businessEnvironmentId !== context.businessEnvironmentId ||
    order.workspaceId !== context.workspaceId
  ) {
    throw new CoffeeBarOperationError('ACCESS_DENIED');
  }
}

function nextOrderNumber(orders: ReadonlyArray<CoffeeOrder>): string {
  const highest = orders.reduce((maximum, order) => {
    const numeric = Number.parseInt(order.orderNumber.replace(/\D/gu, ''), 10);
    return Number.isFinite(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `Б-${String(highest + 1).padStart(4, '0')}`;
}

export function createCoffeeBarService({
  operational,
  orders,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): CoffeeBarService {
  async function authorizedSnapshot(
    context: CoffeeBarRuntimeContext,
  ): Promise<OperationalSnapshot> {
    if (
      !context.projectId ||
      !context.businessEnvironmentId ||
      !context.workspaceId ||
      !context.employeeId
    ) {
      throw new CoffeeBarOperationError('ACCESS_DENIED');
    }
    const snapshot = await operational.load(context.projectId);
    const workspace = snapshot.solutionStructure.workspaces.find(
      (candidate) =>
        candidate.id === context.workspaceId && candidate.moduleId === 'bar',
    );
    const employee = snapshot.employees.find(
      (candidate) =>
        candidate.id === context.employeeId &&
        candidate.status === 'active' &&
        candidate.employmentStatus === 'active',
    );
    if (
      !workspace ||
      !employee ||
      !workspace.assignedEmployeeIds.includes(employee.id)
    ) {
      throw new CoffeeBarOperationError('ACCESS_DENIED');
    }
    return snapshot;
  }

  function auditEntry(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    operation: CoffeeBarAuditEntry['operation'],
  ): CoffeeBarAuditEntry {
    return {
      id: createId(),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      orderId,
      employeeId: context.employeeId,
      operation,
      occurredAt: now(),
    };
  }

  async function saveOrder(
    context: CoffeeBarRuntimeContext,
    store: CoffeeBarStore,
    order: CoffeeOrder,
    operation?: CoffeeBarAuditEntry['operation'],
  ): Promise<CoffeeOrder> {
    const updatedStore = operation
      ? audit(replaceOrder(store, order), auditEntry(context, order.orderId, operation))
      : replaceOrder(store, order);
    await orders.save(context.projectId, updatedStore);
    return structuredClone(order);
  }

  async function createOrder(
    context: CoffeeBarRuntimeContext,
    tableId: string | null,
  ): Promise<CoffeeOrder> {
    const snapshot = await authorizedSnapshot(context);
    const location =
      snapshot.locations.find(
        (candidate) => candidate.id === snapshot.project.defaultLocationId,
      ) ?? snapshot.locations.find((candidate) => candidate.status === 'active');
    if (!location) throw new CoffeeBarOperationError('NOT_FOUND');
    if (tableId) {
      const table = snapshot.tables.find(
        (candidate) =>
          candidate.id === tableId &&
          candidate.locationId === location.id &&
          candidate.status === 'active',
      );
      if (!table) throw new CoffeeBarOperationError('NOT_FOUND');
    }
    const store = await orders.load(context.projectId);
    if (
      tableId &&
      store.orders.some(
        (order) =>
          order.businessEnvironmentId === context.businessEnvironmentId &&
          order.tableId === tableId &&
          !terminalStatuses.has(order.status),
      )
    ) {
      throw new CoffeeBarOperationError('TABLE_OCCUPIED');
    }
    const timestamp = now();
    const order: CoffeeOrder = {
      orderId: createId(),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      workspaceId: context.workspaceId,
      locationId: location.id,
      orderType: tableId ? 'TABLE' : 'TAKEAWAY',
      tableId,
      orderNumber: nextOrderNumber(store.orders),
      status: 'DRAFT',
      createdAt: timestamp,
      createdByEmployeeId: context.employeeId,
      paymentStatus: 'UNPAID',
      total: 0,
      issuedAt: null,
      updatedAt: timestamp,
      items: [],
    };
    await orders.save(
      context.projectId,
      audit(
        { ...store, orders: [...store.orders, order] },
        auditEntry(context, order.orderId, 'ORDER_CREATED'),
      ),
    );
    return structuredClone(order);
  }

  return {
    async load(context) {
      const [snapshot, store] = await Promise.all([
        authorizedSnapshot(context),
        orders.load(context.projectId),
      ]);
      const location =
        snapshot.locations.find(
          (candidate) => candidate.id === snapshot.project.defaultLocationId,
        ) ?? snapshot.locations.find((candidate) => candidate.status === 'active');
      const employee = snapshot.employees.find(
        (candidate) => candidate.id === context.employeeId,
      );
      if (!location || !employee) throw new CoffeeBarOperationError('NOT_FOUND');
      const scopedOrders = store.orders.filter(
        (order) =>
          order.businessEnvironmentId === context.businessEnvironmentId &&
          order.workspaceId === context.workspaceId,
      );
      return {
        establishmentName:
          snapshot.businessProfile.brandName ||
          snapshot.businessProfile.businessName ||
          snapshot.project.name,
        locationId: location.id,
        locationName: location.name,
        employeeId: employee.id,
        employeeName: employee.fullName,
        tables: snapshot.tables
          .filter(
            (table) => table.locationId === location.id && table.status === 'active',
          )
          .map((table) => {
            const activeOrder = scopedOrders.find(
              (order) =>
                order.tableId === table.id && !terminalStatuses.has(order.status),
            );
            const status = !activeOrder
              ? 'FREE'
              : activeOrder.status === 'READY' && activeOrder.paymentStatus === 'UNPAID'
                ? 'UNPAID'
                : activeOrder.status === 'READY'
                  ? 'READY'
                  : 'OCCUPIED';
            return {
              id: table.id,
              name: table.name,
              code: table.code,
              seats: table.seats,
              status,
              activeOrderId: activeOrder?.orderId ?? null,
            };
          }),
        categories: snapshot.menuCategories
          .filter((category) => category.status === 'active')
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((category) => ({ id: category.id, name: category.name })),
        products: snapshot.menuItems
          .filter((item) => item.status === 'active')
          .map((item) => ({
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            price: item.sellingPrice,
            currency: item.currency ?? location.currency,
            modifierGroupIds: item.modifierGroupIds,
          })),
        modifierGroups: snapshot.modifiers
          .filter((group) => group.status === 'active')
          .map((group) => ({
            id: group.id,
            name: group.name,
            options: parseModifierOptions(group.options),
          })),
        orders: scopedOrders,
      };
    },
    createTableOrder: (context, tableId) => createOrder(context, tableId),
    createTakeawayOrder: (context) => createOrder(context, null),
    async addItem(context, orderId, input) {
      const snapshot = await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      ensureDraft(order);
      const product = snapshot.menuItems.find(
        (candidate) =>
          candidate.id === input.productId && candidate.status === 'active',
      );
      if (!product) throw new CoffeeBarOperationError('NOT_FOUND');
      const modifiers = (input.modifiers ?? []).map((selection) => {
        const group = snapshot.modifiers.find(
          (candidate) =>
            candidate.id === selection.modifierGroupId &&
            product.modifierGroupIds.includes(candidate.id) &&
            candidate.status === 'active',
        );
        const option = group
          ? parseModifierOptions(group.options).find(
              (candidate) => candidate.name === selection.optionName,
            )
          : undefined;
        if (!group || !option) throw new CoffeeBarOperationError('NOT_FOUND');
        return {
          modifierGroupId: group.id,
          modifierName: group.name,
          optionName: option.name,
          priceAdjustment: option.priceAdjustment,
        };
      });
      const item: CoffeeOrderItem = {
        id: createId(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        modifiers,
        comment: input.comment?.trim() ?? '',
        preparationWorkspace: preparationWorkspace(snapshot, product.id),
        status: 'DRAFT',
      };
      const updated = withTotal({
        ...order,
        items: [...order.items, item],
        updatedAt: now(),
      });
      return saveOrder(context, store, updated);
    },
    async updateItemQuantity(context, orderId, itemId, quantity) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      ensureDraft(order);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      if (!order.items.some((item) => item.id === itemId)) {
        throw new CoffeeBarOperationError('NOT_FOUND');
      }
      const updated = withTotal({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        ),
        updatedAt: now(),
      });
      return saveOrder(context, store, updated);
    },
    async updateItemDetails(context, orderId, itemId, input) {
      const snapshot = await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      ensureDraft(order);
      const currentItem = order.items.find((item) => item.id === itemId);
      if (!currentItem) throw new CoffeeBarOperationError('NOT_FOUND');
      const product = snapshot.menuItems.find(
        (candidate) => candidate.id === currentItem.productId,
      );
      if (!product) throw new CoffeeBarOperationError('NOT_FOUND');
      const modifiers = (input.modifiers ?? []).map((selection) => {
        const group = snapshot.modifiers.find(
          (candidate) =>
            candidate.id === selection.modifierGroupId &&
            product.modifierGroupIds.includes(candidate.id),
        );
        const option = group
          ? parseModifierOptions(group.options).find(
              (candidate) => candidate.name === selection.optionName,
            )
          : undefined;
        if (!group || !option) throw new CoffeeBarOperationError('NOT_FOUND');
        return {
          modifierGroupId: group.id,
          modifierName: group.name,
          optionName: option.name,
          priceAdjustment: option.priceAdjustment,
        };
      });
      const updated = withTotal({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                modifiers,
                comment: input.comment?.trim() ?? item.comment,
              }
            : item,
        ),
        updatedAt: now(),
      });
      return saveOrder(context, store, updated);
    },
    async removeItem(context, orderId, itemId) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      ensureDraft(order);
      if (!order.items.some((item) => item.id === itemId)) {
        throw new CoffeeBarOperationError('NOT_FOUND');
      }
      const updated = withTotal({
        ...order,
        items: order.items.filter((item) => item.id !== itemId),
        updatedAt: now(),
      });
      return saveOrder(context, store, updated);
    },
    async sendOrder(context, orderId) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      if (order.status !== 'DRAFT') return structuredClone(order);
      if (order.items.length === 0) {
        throw new CoffeeBarOperationError('ORDER_EMPTY');
      }
      const items = order.items.map((item) => ({
        ...item,
        status: (item.preparationWorkspace === 'IMMEDIATE'
          ? 'READY'
          : 'NEW') as CoffeeOrderItemStatus,
      }));
      const updatedBase: CoffeeOrder = {
        ...order,
        items,
        status: 'SENT',
        updatedAt: now(),
      };
      const updated = {
        ...updatedBase,
        status: statusAfterPreparation(updatedBase),
      };
      return saveOrder(context, store, updated, 'ORDER_SENT');
    },
    async updateBarItemStatus(context, orderId, itemId, status) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      if (terminalStatuses.has(order.status) || order.status === 'DRAFT') {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const item = order.items.find((candidate) => candidate.id === itemId);
      if (!item) throw new CoffeeBarOperationError('NOT_FOUND');
      if (item.preparationWorkspace !== 'BAR') {
        throw new CoffeeBarOperationError('ITEM_ROUTE_MISMATCH');
      }
      const allowedNext: Partial<Record<CoffeeOrderItemStatus, CoffeeOrderItemStatus>> =
        {
          NEW: 'ACCEPTED',
          ACCEPTED: 'PREPARING',
          PREPARING: 'READY',
        };
      if (item.status === status) return structuredClone(order);
      if (allowedNext[item.status] !== status) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const updatedBase: CoffeeOrder = {
        ...order,
        items: order.items.map((candidate) =>
          candidate.id === itemId ? { ...candidate, status } : candidate,
        ),
        updatedAt: now(),
      };
      const updated = {
        ...updatedBase,
        status: statusAfterPreparation(updatedBase),
      };
      return saveOrder(context, store, updated, 'ITEM_STATUS_CHANGED');
    },
    async setPayment(context, orderId, status) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      if (
        order.status === 'DRAFT' ||
        order.status === 'CANCELLED' ||
        order.status === 'ISSUED'
      ) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      if (order.paymentStatus === status) return structuredClone(order);
      const updated = { ...order, paymentStatus: status, updatedAt: now() };
      return saveOrder(context, store, updated, 'PAYMENT_CHANGED');
    },
    async issueOrder(context, orderId) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      if (order.status === 'ISSUED') return structuredClone(order);
      if (order.status !== 'READY') {
        throw new CoffeeBarOperationError('ORDER_NOT_READY');
      }
      if (order.paymentStatus === 'UNPAID') {
        throw new CoffeeBarOperationError('PAYMENT_REQUIRED');
      }
      const timestamp = now();
      const updated: CoffeeOrder = {
        ...order,
        status: 'ISSUED',
        issuedAt: timestamp,
        updatedAt: timestamp,
      };
      return saveOrder(context, store, updated, 'ORDER_ISSUED');
    },
    async cancelOrder(context, orderId) {
      await authorizedSnapshot(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      ensureContextOrder(context, order);
      if (order.status === 'CANCELLED') return structuredClone(order);
      if (
        order.status === 'READY' ||
        order.status === 'ISSUED' ||
        order.items.some((item) => item.status === 'READY')
      ) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const updated: CoffeeOrder = {
        ...order,
        status: 'CANCELLED',
        items: order.items.map((item) => ({ ...item, status: 'CANCELLED' })),
        updatedAt: now(),
      };
      return saveOrder(context, store, updated, 'ORDER_CANCELLED');
    },
    subscribe: (context, listener) => orders.subscribe(context.projectId, listener),
  };
}
