import type {
  CoffeeBarAuditEntry,
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeBarStore,
  CoffeeOrder,
  CoffeeOrderBatch,
  CoffeeOrderItem,
  CoffeeOrderItemDraftInput,
  CoffeeOrderItemStatus,
  CoffeePaymentMethod,
  CoffeePreparationWorkspace,
  CoffeeSeatingInput,
} from './bar-domain';
import {
  CoffeeBarOperationError,
  type CoffeeBarOrderRepository,
} from './bar-repository-contracts';
import type { ModifierGroup } from './domain';
import type { CoffeeOperationalReadRepository } from './repository-contracts';

export interface CoffeeBarService {
  load(context: CoffeeBarRuntimeContext): Promise<CoffeeBarState>;
  createTableOrder(
    context: CoffeeBarRuntimeContext,
    tableId: string,
    seating: CoffeeSeatingInput,
  ): Promise<CoffeeOrder>;
  createUnassignedOrder(context: CoffeeBarRuntimeContext): Promise<CoffeeOrder>;
  createTakeawayOrder(context: CoffeeBarRuntimeContext): Promise<CoffeeOrder>;
  assignOrder(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    destination:
      | {
          readonly type: 'TABLE';
          readonly tableId: string;
          readonly seating: CoffeeSeatingInput;
        }
      | { readonly type: 'TAKEAWAY' },
  ): Promise<CoffeeOrder>;
  changeGuestCount(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    seating: CoffeeSeatingInput,
  ): Promise<CoffeeOrder>;
  transferOrder(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    tableId: string,
    allowCapacityOverride?: boolean,
  ): Promise<CoffeeOrder>;
  releaseTable(context: CoffeeBarRuntimeContext, orderId: string): Promise<void>;
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
    input: CoffeeOrderItemDraftInput,
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
  recordPayment(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    method: CoffeePaymentMethod,
  ): Promise<CoffeeOrder>;
  completeOrder(
    context: CoffeeBarRuntimeContext,
    orderId: string,
  ): Promise<CoffeeOrder>;
  cancelOrder(
    context: CoffeeBarRuntimeContext,
    orderId: string,
    reason?: string,
  ): Promise<CoffeeOrder>;
  subscribe(context: CoffeeBarRuntimeContext, listener: () => void): () => void;
}

interface Dependencies {
  operational: CoffeeOperationalReadRepository;
  orders: CoffeeBarOrderRepository;
  now?: () => string;
  createId?: () => string;
}

type OperationalSnapshot = Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>;
const terminalStatuses = new Set<CoffeeOrder['status']>(['COMPLETED', 'CANCELLED']);

const money = (value: number): number => Math.round(value * 100) / 100;
const itemTotal = (item: CoffeeOrderItem): number =>
  money(item.finalUnitPrice * item.quantity);
const withTotal = (order: CoffeeOrder): CoffeeOrder => ({
  ...order,
  total: money(order.items.reduce((sum, item) => sum + itemTotal(item), 0)),
});

function parsePriceAdjustment(value: string): number {
  const match = value.match(/\+\s*(\d+(?:[.,]\d+)?)/u);
  return match ? Number.parseFloat(match[1]?.replace(',', '.') ?? '0') : 0;
}

function parseOptions(group: ModifierGroup): ReadonlyArray<{
  name: string;
  priceAdjustment: number;
}> {
  return group.options
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((name) => ({ name, priceAdjustment: parsePriceAdjustment(name) }));
}

function routeFor(
  snapshot: OperationalSnapshot,
  productId: string,
): CoffeePreparationWorkspace {
  const product = snapshot.menuItems.find((candidate) => candidate.id === productId);
  if (!product) throw new CoffeeBarOperationError('NOT_FOUND');
  if (!product.recipeId) return 'IMMEDIATE';
  return product.preparationLocationId &&
    product.preparationLocationId !== snapshot.project.defaultLocationId
    ? 'KITCHEN'
    : 'BAR';
}

function findOrder(store: CoffeeBarStore, orderId: string): CoffeeOrder {
  const order = store.orders.find((candidate) => candidate.orderId === orderId);
  if (!order) throw new CoffeeBarOperationError('NOT_FOUND');
  return order;
}

function assertContext(context: CoffeeBarRuntimeContext, order: CoffeeOrder): void {
  if (
    order.projectId !== context.projectId ||
    order.businessEnvironmentId !== context.businessEnvironmentId ||
    order.workspaceId !== context.workspaceId
  ) {
    throw new CoffeeBarOperationError('ACCESS_DENIED');
  }
}

function assertMutable(order: CoffeeOrder): void {
  if (terminalStatuses.has(order.status) || order.paymentStatus === 'PAID') {
    throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
  }
}

function findDraftItem(order: CoffeeOrder, itemId: string): CoffeeOrderItem {
  const item = order.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new CoffeeBarOperationError('NOT_FOUND');
  if (item.status !== 'DRAFT' || item.submittedBatchId) {
    throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
  }
  return item;
}

function nextOrderNumber(orders: ReadonlyArray<CoffeeOrder>): string {
  const highest = orders.reduce((maximum, order) => {
    const numeric = Number.parseInt(order.orderNumber.replace(/\D/gu, ''), 10);
    return Number.isFinite(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `Б-${String(highest + 1).padStart(4, '0')}`;
}

function preparationStatus(order: CoffeeOrder): CoffeeOrder['status'] {
  const submitted = order.items.filter((item) => item.submittedBatchId);
  if (submitted.length === 0) return 'DRAFT';
  if (submitted.every((item) => item.status === 'READY')) return 'READY';
  if (
    submitted.some((item) => item.status === 'ACCEPTED' || item.status === 'PREPARING')
  ) {
    return 'IN_PREPARATION';
  }
  return 'SENT';
}

function tableStatus(order: CoffeeOrder): CoffeeBarState['tables'][number]['status'] {
  if (order.paymentStatus === 'PAID') {
    return order.status === 'READY' ? 'AWAITING_COMPLETION' : 'PAID';
  }
  if (order.status === 'DRAFT') return order.items.length ? 'DRAFT' : 'OCCUPIED';
  if (order.status === 'SENT') return 'SENT';
  if (order.status === 'IN_PREPARATION') return 'IN_PREPARATION';
  if (order.status === 'READY') return 'READY';
  return 'OCCUPIED';
}

function selectedModifiers(
  snapshot: OperationalSnapshot,
  productId: string,
  selections: CoffeeOrderItemDraftInput['modifiers'],
): CoffeeOrderItem['modifiers'] {
  const product = snapshot.menuItems.find((candidate) => candidate.id === productId);
  if (!product) throw new CoffeeBarOperationError('NOT_FOUND');
  const chosen = selections ?? [];
  const result: CoffeeOrderItem['modifiers'][number][] = [];
  for (const groupId of product.modifierGroupIds) {
    const group = snapshot.modifiers.find(
      (candidate) => candidate.id === groupId && candidate.status === 'active',
    );
    if (!group) continue;
    const groupSelections = chosen.filter(
      (selection) => selection.modifierGroupId === group.id,
    );
    const minimum = group.required
      ? Math.max(1, group.minimumSelections)
      : group.minimumSelections;
    if (
      groupSelections.length < minimum ||
      groupSelections.length > group.maximumSelections ||
      (group.selectionType === 'single' && groupSelections.length > 1)
    ) {
      throw new CoffeeBarOperationError('INVALID_MODIFIERS');
    }
    const options = parseOptions(group);
    for (const selection of groupSelections) {
      const option = options.find(
        (candidate) => candidate.name === selection.optionName,
      );
      if (!option) throw new CoffeeBarOperationError('INVALID_MODIFIERS');
      result.push({
        modifierGroupId: group.id,
        modifierName: group.name,
        optionName: option.name,
        priceAdjustment: option.priceAdjustment,
      });
    }
  }
  if (
    chosen.some(
      (selection) => !product.modifierGroupIds.includes(selection.modifierGroupId),
    )
  ) {
    throw new CoffeeBarOperationError('INVALID_MODIFIERS');
  }
  return result;
}

export function createCoffeeBarService({
  operational,
  orders,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): CoffeeBarService {
  async function snapshotFor(
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
    detail: string | null = null,
  ): CoffeeBarAuditEntry {
    return {
      id: createId(),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      orderId,
      employeeId: context.employeeId,
      operation,
      occurredAt: now(),
      detail,
    };
  }

  async function persist(
    context: CoffeeBarRuntimeContext,
    store: CoffeeBarStore,
    order: CoffeeOrder,
    operation?: CoffeeBarAuditEntry['operation'],
    detail?: string,
  ): Promise<CoffeeOrder> {
    const replaced = {
      ...store,
      orders: store.orders.map((candidate) =>
        candidate.orderId === order.orderId ? order : candidate,
      ),
    };
    const next = operation
      ? {
          ...replaced,
          audit: [
            auditEntry(context, order.orderId, operation, detail ?? null),
            ...replaced.audit,
          ].slice(0, 500),
        }
      : replaced;
    await orders.save(context.projectId, next);
    return structuredClone(order);
  }

  async function createOrder(
    context: CoffeeBarRuntimeContext,
    orderType: CoffeeOrder['orderType'],
    tableId: string | null,
    seating: CoffeeSeatingInput,
  ): Promise<CoffeeOrder> {
    const snapshot = await snapshotFor(context);
    const location =
      snapshot.locations.find(
        (candidate) => candidate.id === snapshot.project.defaultLocationId,
      ) ?? snapshot.locations.find((candidate) => candidate.status === 'active');
    if (!location) throw new CoffeeBarOperationError('NOT_FOUND');
    const table = tableId
      ? snapshot.tables.find(
          (candidate) =>
            candidate.id === tableId &&
            candidate.locationId === location.id &&
            candidate.status === 'active',
        )
      : undefined;
    if (tableId && !table) throw new CoffeeBarOperationError('NOT_FOUND');
    if (
      table &&
      seating.guestCount > table.seatCount &&
      !seating.allowCapacityOverride
    ) {
      throw new CoffeeBarOperationError('CAPACITY_EXCEEDED');
    }
    if (!Number.isInteger(seating.guestCount) || seating.guestCount < 1) {
      throw new CoffeeBarOperationError('INVALID_OPERATION');
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
      orderType,
      tableId,
      orderNumber: nextOrderNumber(store.orders),
      status: 'DRAFT',
      guestCount: seating.guestCount,
      seatingNote: seating.note?.trim() ?? '',
      openedAt: timestamp,
      openedByEmployeeId: context.employeeId,
      createdAt: timestamp,
      createdByEmployeeId: context.employeeId,
      paymentStatus: 'UNPAID',
      paymentMethod: null,
      paidAmount: null,
      paidAt: null,
      paidByEmployeeId: null,
      total: 0,
      issuedAt: null,
      completedAt: null,
      completedByEmployeeId: null,
      cancellationReason: null,
      updatedAt: timestamp,
      items: [],
      batches: [],
    };
    await orders.save(context.projectId, {
      orders: [...store.orders, order],
      audit: [auditEntry(context, order.orderId, 'ORDER_CREATED'), ...store.audit],
    });
    return structuredClone(order);
  }

  return {
    async load(context) {
      const [snapshot, store] = await Promise.all([
        snapshotFor(context),
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
        zones: snapshot.floorPlanZones
          .filter((zone) => zone.locationId === location.id && zone.active)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((zone) => ({
            id: zone.id,
            name: zone.name,
            canvasWidth: zone.canvasWidth,
            canvasHeight: zone.canvasHeight,
          })),
        tables: snapshot.tables
          .filter(
            (table) => table.locationId === location.id && table.status === 'active',
          )
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((table) => {
            const activeOrder = scopedOrders.find(
              (order) =>
                order.tableId === table.id && !terminalStatuses.has(order.status),
            );
            return {
              id: table.id,
              zoneId: table.zoneId,
              name: table.name,
              code: table.code,
              seatCount: table.seatCount,
              shape: table.shape,
              positionX: table.positionX,
              positionY: table.positionY,
              width: table.width,
              height: table.height,
              rotation: table.rotation,
              status: activeOrder ? tableStatus(activeOrder) : 'FREE',
              activeOrderId: activeOrder?.orderId ?? null,
            };
          }),
        categories: snapshot.menuCategories
          .filter((category) => category.status === 'active')
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map(({ id, name }) => ({ id, name })),
        products: snapshot.menuItems
          .filter((product) => product.status === 'active')
          .map((product) => ({
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            price: product.sellingPrice,
            currency: product.currency ?? location.currency,
            modifierGroupIds: product.modifierGroupIds,
          })),
        modifierGroups: snapshot.modifiers
          .filter((group) => group.status === 'active')
          .map((group) => ({
            id: group.id,
            name: group.name,
            selectionType: group.selectionType,
            required: group.required,
            minimumSelections: group.minimumSelections,
            maximumSelections: group.maximumSelections,
            defaultOptionName: null,
            options: parseOptions(group),
          })),
        orders: scopedOrders,
      };
    },
    createTableOrder: (context, tableId, seating) =>
      createOrder(context, 'TABLE', tableId, seating),
    createUnassignedOrder: (context) =>
      createOrder(context, 'UNASSIGNED', null, { guestCount: 1 }),
    createTakeawayOrder: (context) =>
      createOrder(context, 'TAKEAWAY', null, { guestCount: 1 }),
    async assignOrder(context, orderId, destination) {
      const snapshot = await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      if (order.orderType !== 'UNASSIGNED') {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      if (destination.type === 'TAKEAWAY') {
        return persist(
          context,
          store,
          { ...order, orderType: 'TAKEAWAY', updatedAt: now() },
          'ORDER_ASSIGNED',
          'TAKEAWAY',
        );
      }
      const table = snapshot.tables.find(
        (candidate) =>
          candidate.id === destination.tableId &&
          candidate.locationId === order.locationId &&
          candidate.status === 'active',
      );
      if (!table) throw new CoffeeBarOperationError('NOT_FOUND');
      if (
        !Number.isInteger(destination.seating.guestCount) ||
        destination.seating.guestCount < 1
      ) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      if (
        store.orders.some(
          (candidate) =>
            candidate.tableId === table.id && !terminalStatuses.has(candidate.status),
        )
      ) {
        throw new CoffeeBarOperationError('TABLE_NOT_FREE');
      }
      if (
        destination.seating.guestCount > table.seatCount &&
        !destination.seating.allowCapacityOverride
      ) {
        throw new CoffeeBarOperationError('CAPACITY_EXCEEDED');
      }
      return persist(
        context,
        store,
        {
          ...order,
          orderType: 'TABLE',
          tableId: table.id,
          guestCount: destination.seating.guestCount,
          seatingNote: destination.seating.note?.trim() ?? '',
          updatedAt: now(),
        },
        'ORDER_ASSIGNED',
        table.id,
      );
    },
    async changeGuestCount(context, orderId, seating) {
      const snapshot = await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      const table = order.tableId
        ? snapshot.tables.find((candidate) => candidate.id === order.tableId)
        : undefined;
      if (
        !Number.isInteger(seating.guestCount) ||
        seating.guestCount < 1 ||
        (table &&
          seating.guestCount > table.seatCount &&
          !seating.allowCapacityOverride)
      ) {
        throw new CoffeeBarOperationError(
          table && seating.guestCount > table.seatCount
            ? 'CAPACITY_EXCEEDED'
            : 'INVALID_OPERATION',
        );
      }
      return persist(
        context,
        store,
        {
          ...order,
          guestCount: seating.guestCount,
          seatingNote: seating.note?.trim() ?? order.seatingNote,
          updatedAt: now(),
        },
        'GUEST_COUNT_CHANGED',
        String(seating.guestCount),
      );
    },
    async transferOrder(context, orderId, tableId, allowCapacityOverride = false) {
      const snapshot = await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      if (order.orderType === 'UNASSIGNED')
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      const table = snapshot.tables.find(
        (candidate) =>
          candidate.id === tableId &&
          candidate.locationId === order.locationId &&
          candidate.status === 'active',
      );
      if (!table) throw new CoffeeBarOperationError('NOT_FOUND');
      if (
        store.orders.some(
          (candidate) =>
            candidate.orderId !== orderId &&
            candidate.tableId === tableId &&
            !terminalStatuses.has(candidate.status),
        )
      ) {
        throw new CoffeeBarOperationError('TABLE_NOT_FREE');
      }
      if (order.guestCount > table.seatCount && !allowCapacityOverride) {
        throw new CoffeeBarOperationError('CAPACITY_EXCEEDED');
      }
      return persist(
        context,
        store,
        { ...order, orderType: 'TABLE', tableId, updatedAt: now() },
        'ORDER_TRANSFERRED',
        `${order.tableId ?? order.orderType}->${tableId}`,
      );
    },
    async releaseTable(context, orderId) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      if (
        order.orderType !== 'TABLE' ||
        order.items.length > 0 ||
        order.batches.length > 0 ||
        order.status !== 'DRAFT'
      ) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      await orders.save(context.projectId, {
        orders: store.orders.filter((candidate) => candidate.orderId !== orderId),
        audit: [auditEntry(context, orderId, 'ORDER_RELEASED'), ...store.audit],
      });
    },
    async addItem(context, orderId, input) {
      const snapshot = await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      const product = snapshot.menuItems.find(
        (candidate) =>
          candidate.id === input.productId && candidate.status === 'active',
      );
      if (!product) throw new CoffeeBarOperationError('NOT_FOUND');
      const modifiers = selectedModifiers(snapshot, product.id, input.modifiers);
      const finalUnitPrice = money(
        product.sellingPrice +
          modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0),
      );
      const item: CoffeeOrderItem = {
        id: createId(),
        productId: product.id,
        productName: product.name,
        variantName: input.variantName?.trim() || null,
        quantity: 1,
        unitPrice: product.sellingPrice,
        finalUnitPrice,
        modifiers,
        comment: input.comment?.trim() ?? '',
        preparationWorkspace: routeFor(snapshot, product.id),
        status: 'DRAFT',
        submittedBatchId: null,
      };
      return persist(
        context,
        store,
        withTotal({ ...order, items: [...order.items, item], updatedAt: now() }),
      );
    },
    async updateItemQuantity(context, orderId, itemId, quantity) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      findDraftItem(order, itemId);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      return persist(
        context,
        store,
        withTotal({
          ...order,
          updatedAt: now(),
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        }),
      );
    },
    async updateItemDetails(context, orderId, itemId, input) {
      const snapshot = await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      const item = findDraftItem(order, itemId);
      const modifiers = selectedModifiers(snapshot, item.productId, input.modifiers);
      const finalUnitPrice = money(
        item.unitPrice +
          modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0),
      );
      return persist(
        context,
        store,
        withTotal({
          ...order,
          updatedAt: now(),
          items: order.items.map((candidate) =>
            candidate.id === itemId
              ? {
                  ...candidate,
                  variantName: input.variantName?.trim() || null,
                  modifiers,
                  comment: input.comment?.trim() ?? '',
                  finalUnitPrice,
                }
              : candidate,
          ),
        }),
      );
    },
    async removeItem(context, orderId, itemId) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      findDraftItem(order, itemId);
      return persist(
        context,
        store,
        withTotal({
          ...order,
          items: order.items.filter((item) => item.id !== itemId),
          updatedAt: now(),
        }),
      );
    },
    async sendOrder(context, orderId) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      if (order.orderType === 'UNASSIGNED') {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const draftItems = order.items.filter((item) => item.status === 'DRAFT');
      if (draftItems.length === 0) throw new CoffeeBarOperationError('ORDER_EMPTY');
      const timestamp = now();
      const batchId = createId();
      const batch: CoffeeOrderBatch = {
        batchId,
        orderId,
        createdAt: timestamp,
        createdByEmployeeId: context.employeeId,
        itemIds: draftItems.map((item) => item.id),
        sentAt: timestamp,
        status: 'SENT',
      };
      const updated = {
        ...order,
        status: 'SENT' as const,
        batches: [...order.batches, batch],
        items: order.items.map((item): CoffeeOrderItem =>
          item.status === 'DRAFT'
            ? {
                ...item,
                submittedBatchId: batchId,
                status: item.preparationWorkspace === 'IMMEDIATE' ? 'READY' : 'NEW',
              }
            : item,
        ),
        updatedAt: timestamp,
      };
      const next = { ...updated, status: preparationStatus(updated) };
      return persist(context, store, next, 'BATCH_SENT', batchId);
    },
    async updateBarItemStatus(context, orderId, itemId, status) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      if (terminalStatuses.has(order.status))
        throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
      const item = order.items.find((candidate) => candidate.id === itemId);
      if (!item) throw new CoffeeBarOperationError('NOT_FOUND');
      if (item.preparationWorkspace !== 'BAR')
        throw new CoffeeBarOperationError('ITEM_ROUTE_MISMATCH');
      const transitions: Record<string, ReadonlyArray<CoffeeOrderItemStatus>> = {
        NEW: ['ACCEPTED'],
        ACCEPTED: ['PREPARING'],
        PREPARING: ['READY'],
        READY: ['READY'],
      };
      if (!transitions[item.status]?.includes(status)) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const changed = {
        ...order,
        items: order.items.map((candidate) =>
          candidate.id === itemId ? { ...candidate, status } : candidate,
        ),
        updatedAt: now(),
      };
      return persist(
        context,
        store,
        { ...changed, status: preparationStatus(changed) },
        'ITEM_STATUS_CHANGED',
        `${itemId}:${status}`,
      );
    },
    async recordPayment(context, orderId, method) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      if (terminalStatuses.has(order.status))
        throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
      if (order.paymentStatus === 'PAID')
        throw new CoffeeBarOperationError('PAYMENT_ALREADY_RECORDED');
      if (!order.items.length || order.items.some((item) => item.status === 'DRAFT')) {
        throw new CoffeeBarOperationError('INVALID_OPERATION');
      }
      const timestamp = now();
      return persist(
        context,
        store,
        {
          ...order,
          paymentStatus: 'PAID',
          paymentMethod: method,
          paidAmount: order.total,
          paidAt: timestamp,
          paidByEmployeeId: context.employeeId,
          updatedAt: timestamp,
        },
        'PAYMENT_RECORDED',
        method,
      );
    },
    async completeOrder(context, orderId) {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      if (terminalStatuses.has(order.status))
        throw new CoffeeBarOperationError('ORDER_IMMUTABLE');
      if (order.paymentStatus !== 'PAID')
        throw new CoffeeBarOperationError('PAYMENT_REQUIRED');
      if (!order.items.length || order.items.some((item) => item.status !== 'READY')) {
        throw new CoffeeBarOperationError('ORDER_NOT_READY');
      }
      const timestamp = now();
      return persist(
        context,
        store,
        {
          ...order,
          status: 'COMPLETED',
          issuedAt: timestamp,
          completedAt: timestamp,
          completedByEmployeeId: context.employeeId,
          updatedAt: timestamp,
        },
        'ORDER_COMPLETED',
      );
    },
    async cancelOrder(context, orderId, reason = '') {
      await snapshotFor(context);
      const store = await orders.load(context.projectId);
      const order = findOrder(store, orderId);
      assertContext(context, order);
      assertMutable(order);
      const hasSubmittedItems = order.items.some((item) => item.submittedBatchId);
      if (hasSubmittedItems && !reason.trim()) {
        throw new CoffeeBarOperationError('CANCELLATION_REASON_REQUIRED');
      }
      return persist(
        context,
        store,
        {
          ...order,
          status: 'CANCELLED',
          cancellationReason: reason.trim() || 'Черновик отменён',
          updatedAt: now(),
        },
        'ORDER_CANCELLED',
        reason.trim() || undefined,
      );
    },
    subscribe(context, listener) {
      return orders.subscribe(context.projectId, listener);
    },
  };
}
