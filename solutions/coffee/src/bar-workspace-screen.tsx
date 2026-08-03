'use client';

import {
  Check,
  ChevronRight,
  Coffee,
  Minus,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type {
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeOrder,
  CoffeeOrderItem,
  CoffeeOrderItemDraftInput,
  CoffeeOrderItemStatus,
  CoffeePaymentMethod,
  CoffeeSeatingInput,
} from './bar-domain';
import { localCoffeeBarOrderRepository } from './bar-local-repository';
import {
  coffeeBarErrorRu,
  coffeeBarRu,
  coffeeOrderItemStatusRu,
  coffeeOrderStatusRu,
  coffeePaymentMethodRu,
  coffeePaymentStatusRu,
  coffeePreparationWorkspaceRu,
  coffeeTableStatusRu,
} from './bar-ru';
import { CoffeeBarOperationError } from './bar-repository-contracts';
import { createCoffeeBarService, type CoffeeBarService } from './bar-service';
import { localCoffeeOperationalReadRepository } from './repositories';

const defaultService = createCoffeeBarService({
  operational: localCoffeeOperationalReadRepository,
  orders: localCoffeeBarOrderRepository,
});
const control =
  'min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const primary =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40';
const secondary =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

const terminal = (order: CoffeeOrder): boolean =>
  order.status === 'COMPLETED' || order.status === 'CANCELLED';
type OrderJournalFilter =
  'ALL' | 'ACTIVE' | 'TAKEAWAY' | 'DELIVERY' | 'READY' | 'COMPLETED' | 'CANCELLED';
type OrderAssignment =
  | {
      readonly type: 'TABLE';
      readonly tableId: string;
      readonly seating: CoffeeSeatingInput;
    }
  | { readonly type: 'TAKEAWAY' };
type ModifierSelection = {
  readonly modifierGroupId: string;
  readonly optionName: string;
};
const currency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);

function nextBarStatus(
  status: CoffeeOrderItemStatus,
): Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'> | null {
  if (status === 'NEW') return 'ACCEPTED';
  if (status === 'ACCEPTED') return 'PREPARING';
  if (status === 'PREPARING') return 'READY';
  return null;
}

export function CoffeeBarWorkspaceScreen({
  context,
  service = defaultService,
}: {
  context: CoffeeBarRuntimeContext;
  service?: CoffeeBarService;
}) {
  const [state, setState] = useState<CoffeeBarState | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [view, setView] = useState<'hall' | 'menu' | 'orders'>('hall');
  const [orderOpen, setOrderOpen] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderJournalFilter>('ACTIVE');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [product, setProduct] = useState<CoffeeBarState['products'][number] | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<CoffeeOrderItem | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await service.load(context);
      setState(next);
      setZoneId((current) =>
        current && next.zones.some((zone) => zone.id === current)
          ? current
          : (next.zones[0]?.id ?? null),
      );
      setSelectedOrderId((current) =>
        current && next.orders.some((order) => order.orderId === current)
          ? current
          : null,
      );
      setMessage(null);
    } catch (error) {
      setState(null);
      setMessage(
        error instanceof CoffeeBarOperationError
          ? coffeeBarErrorRu[error.code]
          : coffeeBarRu.error,
      );
    }
  }, [context, service]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void reload(), 0);
    const unsubscribe = service.subscribe(context, () => void reload());
    return () => {
      window.clearTimeout(initialLoad);
      unsubscribe();
    };
  }, [context, reload, service]);

  async function run(operation: () => Promise<CoffeeOrder>): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const order = await operation();
      setSelectedOrderId(order.orderId);
      await reload();
    } catch (error) {
      setMessage(
        error instanceof CoffeeBarOperationError
          ? coffeeBarErrorRu[error.code]
          : coffeeBarRu.error,
      );
    } finally {
      setBusy(false);
    }
  }

  async function runVoid(operation: () => Promise<void>): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      await operation();
      setSelectedOrderId(null);
      setOrderOpen(false);
      await reload();
    } catch (error) {
      setMessage(
        error instanceof CoffeeBarOperationError
          ? coffeeBarErrorRu[error.code]
          : coffeeBarRu.error,
      );
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <Coffee className="mx-auto size-10 text-blue-600" />
        <p className="mt-4 font-semibold">{message ?? coffeeBarRu.loading}</p>
        {message && (
          <button className={`${secondary} mt-5`} onClick={() => void reload()}>
            {coffeeBarRu.retry}
          </button>
        )}
      </div>
    );
  }

  const selectedOrder = state.orders.find((order) => order.orderId === selectedOrderId);
  const currentZone = state.zones.find((zone) => zone.id === zoneId);
  const visibleTables = state.tables.filter((table) => table.zoneId === zoneId);
  const products = state.products.filter(
    (candidate) =>
      (categoryId === 'all' || candidate.categoryId === categoryId) &&
      candidate.name
        .toLocaleLowerCase('ru')
        .includes(query.trim().toLocaleLowerCase('ru')),
  );
  const isConfigurable = (candidate: CoffeeBarState['products'][number]): boolean =>
    candidate.modifierGroupIds.some((groupId) =>
      state.modifierGroups.some((group) => group.id === groupId),
    );

  async function openFreeTable(table: CoffeeBarState['tables'][number]): Promise<void> {
    setOrderOpen(false);
    await run(() =>
      service.createTableOrder(context, table.id, {
        guestCount: 1,
      }),
    );
    setView('menu');
  }

  async function createOrder(): Promise<void> {
    setOrderOpen(false);
    await run(() => service.createUnassignedOrder(context));
    setView('menu');
  }

  return (
    <section className="flex w-full flex-col lg:h-[calc(100dvh-10.5rem)] lg:min-h-[560px] lg:overflow-hidden">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-[0_14px_40px_rgba(30,64,175,.08)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-[-.03em]">
              {coffeeBarRu.title}
            </h1>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
              {state.locationName}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">
            {state.establishmentName} · {state.employeeName}
          </p>
        </div>
        <nav className="order-3 flex w-full rounded-xl bg-slate-100 p-1 sm:order-none sm:w-auto">
          {(
            [
              ['hall', coffeeBarRu.hall],
              ['menu', coffeeBarRu.menu],
              ['orders', coffeeBarRu.orders],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`min-h-9 flex-1 rounded-lg px-5 text-sm font-semibold transition sm:flex-none ${
                view === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
              onClick={() => {
                if (id === 'orders') setOrderFilter('ACTIVE');
                setView(id);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {selectedOrder && !terminal(selectedOrder) && (
            <button className={secondary} onClick={() => setOrderOpen(true)}>
              {selectedOrder.orderNumber} · {currency(selectedOrder.total)}
            </button>
          )}
          <button
            className={primary}
            disabled={busy}
            onClick={() => void createOrder()}
          >
            <Plus className="size-4" />
            {coffeeBarRu.newOrder}
          </button>
        </div>
      </header>

      {message && (
        <div
          role="alert"
          className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900"
        >
          {message}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {view === 'hall' && (
          <Panel title={coffeeBarRu.floorPlan}>
            <div className="flex gap-2 overflow-x-auto p-3 pb-2">
              {state.zones.map((zone) => (
                <button
                  key={zone.id}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                    zone.id === zoneId
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => setZoneId(zone.id)}
                >
                  {zone.name}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 pt-1">
              {currentZone ? (
                <div
                  className="relative mx-auto min-h-[380px] w-full max-w-5xl overflow-hidden rounded-2xl border border-blue-100 bg-[radial-gradient(circle_at_20%_20%,#eff6ff,white_55%)]"
                  style={{
                    aspectRatio: `${currentZone.canvasWidth}/${currentZone.canvasHeight}`,
                  }}
                >
                  {visibleTables.map((table) => {
                    const style: CSSProperties = {
                      left: `${(table.positionX / currentZone.canvasWidth) * 100}%`,
                      top: `${(table.positionY / currentZone.canvasHeight) * 100}%`,
                      width: `${Math.max(14, (table.width / currentZone.canvasWidth) * 100)}%`,
                      height: `${Math.max(12, (table.height / currentZone.canvasHeight) * 100)}%`,
                      transform: `rotate(${table.rotation}deg)`,
                      borderRadius:
                        table.shape === 'ROUND' || table.shape === 'BAR_SEAT'
                          ? '999px'
                          : table.shape === 'SQUARE'
                            ? '14px'
                            : '12px',
                    };
                    return (
                      <button
                        key={table.id}
                        aria-label={`${table.name}: ${coffeeTableStatusRu[table.status]}`}
                        title={`${table.name} · ${coffeeTableStatusRu[table.status]}`}
                        style={style}
                        className={`absolute grid min-h-12 place-items-center border p-1 text-[10px] font-bold shadow-sm transition ${
                          table.activeOrderId === selectedOrderId
                            ? 'z-10 border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100'
                            : table.status === 'FREE'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : table.status === 'READY' ||
                                  table.status === 'AWAITING_COMPLETION'
                                ? 'border-amber-300 bg-amber-50 text-amber-900'
                                : 'border-blue-300 bg-blue-50 text-blue-900'
                        }`}
                        onClick={() => {
                          if (table.activeOrderId) {
                            setSelectedOrderId(table.activeOrderId);
                            setOrderOpen(true);
                          } else {
                            void openFreeTable(table);
                          }
                        }}
                      >
                        <span>{table.name}</span>
                        <span className="font-medium">{table.seatCount} мест</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty>{coffeeBarRu.noTables}</Empty>
              )}
            </div>
            <div className="border-t border-slate-100 p-3 text-center">
              <p className="text-[11px] text-slate-500">{coffeeBarRu.tableHint}</p>
            </div>
          </Panel>
        )}

        {view === 'menu' && (
          <Panel title="Меню">
            <div className="p-3 pb-2">
              <label className="relative block">
                <Search className="absolute left-3 top-3 size-4 text-slate-400" />
                <input
                  className={`${control} w-full pl-9`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={coffeeBarRu.searchProducts}
                />
              </label>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                <Category
                  active={categoryId === 'all'}
                  onClick={() => setCategoryId('all')}
                >
                  {coffeeBarRu.allCategories}
                </Category>
                {state.categories.map((category) => (
                  <Category
                    key={category.id}
                    active={categoryId === category.id}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </Category>
                ))}
              </div>
            </div>
            {!selectedOrder || terminal(selectedOrder) ? (
              <div className="mx-3 mb-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Сначала откройте стол в разделе «Зал» или создайте новый заказ.
              </div>
            ) : null}
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 pt-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((candidate) => (
                <button
                  key={candidate.id}
                  disabled={
                    busy ||
                    !selectedOrder ||
                    terminal(selectedOrder) ||
                    selectedOrder.paymentStatus === 'PAID'
                  }
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                  onClick={() => {
                    if (!selectedOrder) return;
                    if (isConfigurable(candidate)) {
                      setProduct(candidate);
                      return;
                    }
                    void run(() =>
                      service.addItem(context, selectedOrder.orderId, {
                        productId: candidate.id,
                      }),
                    );
                  }}
                >
                  <span className="block text-sm font-semibold">{candidate.name}</span>
                  <span className="mt-3 block text-xs font-bold text-blue-600">
                    {currency(candidate.price)}
                  </span>
                </button>
              ))}
              {!products.length && <Empty>{coffeeBarRu.noProducts}</Empty>}
            </div>
          </Panel>
        )}

        {view === 'orders' && (
          <OrderJournal
            orders={state.orders}
            tables={state.tables}
            filter={orderFilter}
            query={orderQuery}
            selectedOrderId={selectedOrderId}
            onFilter={setOrderFilter}
            onQuery={setOrderQuery}
            onSelect={(orderId) => {
              setSelectedOrderId(orderId);
              setOrderOpen(true);
            }}
          />
        )}
      </div>

      {orderOpen && selectedOrder && (
        <Modal
          title={`${coffeeBarRu.order} ${selectedOrder.orderNumber}`}
          onClose={() => setOrderOpen(false)}
        >
          <div className="-mx-5 -mb-5 flex max-h-[78vh] min-h-[420px] flex-col border-t border-slate-100">
            <Receipt
              order={selectedOrder}
              state={state}
              busy={busy}
              onEdit={setEditingItem}
              onQuantity={(item, quantity) =>
                run(() =>
                  service.updateItemQuantity(
                    context,
                    selectedOrder.orderId,
                    item.id,
                    quantity,
                  ),
                )
              }
              onRemove={(item) =>
                run(() => service.removeItem(context, selectedOrder.orderId, item.id))
              }
              onSend={() =>
                run(() => service.sendOrder(context, selectedOrder.orderId))
              }
              onStatus={(item, status) =>
                run(() =>
                  service.updateBarItemStatus(
                    context,
                    selectedOrder.orderId,
                    item.id,
                    status,
                  ),
                )
              }
              onPayment={(method) =>
                run(() => service.recordPayment(context, selectedOrder.orderId, method))
              }
              onComplete={() =>
                run(() => service.completeOrder(context, selectedOrder.orderId))
              }
              onCancel={(reason) =>
                run(() => service.cancelOrder(context, selectedOrder.orderId, reason))
              }
              onGuests={(seating) =>
                run(() =>
                  service.changeGuestCount(context, selectedOrder.orderId, seating),
                )
              }
              onTransfer={(tableId, override) =>
                run(() =>
                  service.transferOrder(
                    context,
                    selectedOrder.orderId,
                    tableId,
                    override,
                  ),
                )
              }
              onRelease={() =>
                runVoid(() => service.releaseTable(context, selectedOrder.orderId))
              }
              onAssign={(destination) =>
                run(() =>
                  service.assignOrder(context, selectedOrder.orderId, destination),
                )
              }
              onAddItems={() => {
                setOrderOpen(false);
                setView('menu');
              }}
            />
          </div>
        </Modal>
      )}
      {(product || editingItem) && selectedOrder && (
        <ProductDialog
          state={state}
          product={
            product ??
            state.products.find((candidate) => candidate.id === editingItem?.productId)!
          }
          item={editingItem}
          onClose={() => {
            setProduct(null);
            setEditingItem(null);
          }}
          onSubmit={(input) => {
            const item = editingItem;
            setProduct(null);
            setEditingItem(null);
            void run(() =>
              item
                ? service.updateItemDetails(
                    context,
                    selectedOrder.orderId,
                    item.id,
                    input,
                  )
                : service.addItem(context, selectedOrder.orderId, input),
            );
          }}
        />
      )}
    </section>
  );
}

function OrderJournal({
  orders,
  tables,
  filter,
  query,
  selectedOrderId,
  onFilter,
  onQuery,
  onSelect,
}: {
  orders: CoffeeBarState['orders'];
  tables: CoffeeBarState['tables'];
  filter: OrderJournalFilter;
  query: string;
  selectedOrderId: string | null;
  onFilter: (filter: OrderJournalFilter) => void;
  onQuery: (query: string) => void;
  onSelect: (orderId: string) => void;
}) {
  const filters: ReadonlyArray<[OrderJournalFilter, string]> = [
    ['ALL', coffeeBarRu.filterAll],
    ['ACTIVE', coffeeBarRu.filterActive],
    ['TAKEAWAY', coffeeBarRu.filterTakeaway],
    ['DELIVERY', coffeeBarRu.filterDelivery],
    ['READY', coffeeBarRu.filterReady],
    ['COMPLETED', coffeeBarRu.filterCompleted],
    ['CANCELLED', coffeeBarRu.filterCancelled],
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase('ru');
  const filtered = orders
    .filter((order) => {
      if (filter === 'ACTIVE') return !terminal(order);
      if (filter === 'TAKEAWAY') return order.orderType === 'TAKEAWAY';
      if (filter === 'DELIVERY') return order.orderType === 'DELIVERY';
      if (filter === 'READY') return order.status === 'READY';
      if (filter === 'COMPLETED') return order.status === 'COMPLETED';
      if (filter === 'CANCELLED') return order.status === 'CANCELLED';
      return true;
    })
    .filter((order) =>
      order.orderNumber.toLocaleLowerCase('ru').includes(normalizedQuery),
    )
    .slice()
    .reverse();
  return (
    <Panel title={coffeeBarRu.journal}>
      <div className="p-4">
        <label className="relative block max-w-lg">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <input
            className={`${control} w-full pl-9`}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={coffeeBarRu.searchOrders}
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map(([id, label]) => (
            <Category key={id} active={filter === id} onClick={() => onFilter(id)}>
              {label}
            </Category>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => {
            const table = tables.find((candidate) => candidate.id === order.tableId);
            const selected = order.orderId === selectedOrderId;
            const destination =
              order.orderType === 'TABLE'
                ? (table?.name ?? coffeeBarRu.table)
                : order.orderType === 'TAKEAWAY'
                  ? coffeeBarRu.takeaway
                  : order.orderType === 'DELIVERY'
                    ? coffeeBarRu.filterDelivery
                    : 'Не прикреплён';
            const previewItems = order.items.slice(0, 3);
            const remainingItems = Math.max(
              0,
              order.items.length - previewItems.length,
            );
            return (
              <button
                key={order.orderId}
                aria-pressed={selected}
                className={`rounded-2xl border p-4 text-left transition hover:border-blue-300 ${
                  selected
                    ? 'border-blue-200 bg-blue-50/70 shadow-[0_10px_30px_rgba(37,99,235,.08)]'
                    : 'border-slate-200 bg-white hover:bg-blue-50/40'
                }`}
                onClick={() => onSelect(order.orderId)}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{destination}</strong>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">
                    {coffeeOrderStatusRu[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {order.orderNumber} · {order.guestCount} гост.
                </p>
                <div className="mt-3 space-y-1">
                  {previewItems.map((item) => (
                    <p
                      key={item.id}
                      className="truncate text-xs font-medium text-slate-700"
                    >
                      {item.productName} ×{item.quantity}
                    </p>
                  ))}
                  {remainingItems > 0 && (
                    <p className="text-xs text-slate-500">
                      {coffeeBarRu.moreItems(remainingItems)}
                    </p>
                  )}
                  {order.items.length === 0 && (
                    <p className="text-xs text-slate-400">
                      {coffeeBarRu.emptyOrderPreview}
                    </p>
                  )}
                </div>
                <p className="mt-4 text-sm font-semibold">{currency(order.total)}</p>
              </button>
            );
          })}
        </div>
        {!filtered.length && <Empty>{coffeeBarRu.noOrders}</Empty>}
      </div>
    </Panel>
  );
}

function Receipt({
  order,
  state,
  busy,
  onEdit,
  onQuantity,
  onRemove,
  onSend,
  onStatus,
  onPayment,
  onComplete,
  onCancel,
  onGuests,
  onTransfer,
  onRelease,
  onAssign,
  onAddItems,
}: {
  order: CoffeeOrder;
  state: CoffeeBarState;
  busy: boolean;
  onEdit: (item: CoffeeOrderItem) => void;
  onQuantity: (item: CoffeeOrderItem, quantity: number) => Promise<void>;
  onRemove: (item: CoffeeOrderItem) => Promise<void>;
  onSend: () => Promise<void>;
  onStatus: (
    item: CoffeeOrderItem,
    status: Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'>,
  ) => Promise<void>;
  onPayment: (method: CoffeePaymentMethod) => Promise<void>;
  onComplete: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  onGuests: (input: CoffeeSeatingInput) => Promise<void>;
  onTransfer: (tableId: string, override: boolean) => Promise<void>;
  onRelease: () => Promise<void>;
  onAssign: (destination: OrderAssignment) => Promise<void>;
  onAddItems: () => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const submitted = order.items.filter((item) => item.submittedBatchId);
  const drafts = order.items.filter((item) => !item.submittedBatchId);
  const canComplete =
    order.paymentStatus === 'PAID' &&
    order.items.length > 0 &&
    order.items.every((item) => item.status === 'READY');
  const freeTables = state.tables.filter(
    (table) => table.status === 'FREE' && table.id !== order.tableId,
  );
  const canConfigureItem = (item: CoffeeOrderItem): boolean =>
    state.products
      .find((product) => product.id === item.productId)
      ?.modifierGroupIds.some((groupId) =>
        state.modifierGroups.some((group) => group.id === groupId),
      ) ?? false;
  return (
    <>
      <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
        <div className="flex items-center justify-between gap-2">
          <span>
            {coffeeOrderStatusRu[order.status]} ·{' '}
            {coffeePaymentStatusRu[order.paymentStatus]}
          </span>
          {order.orderType === 'TABLE' && (
            <button
              className="font-semibold text-blue-600"
              onClick={() => setGuestOpen(true)}
            >
              <UsersRound className="mr-1 inline size-3.5" />
              {order.guestCount}
            </button>
          )}
        </div>
      </div>
      {!terminal(order) && order.paymentStatus === 'UNPAID' && (
        <div className="border-b border-slate-100 p-3">
          <button
            className={`${secondary} w-full border-blue-100 text-blue-700`}
            disabled={busy}
            onClick={onAddItems}
          >
            <Plus className="size-4" />
            {coffeeBarRu.addItems}
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ItemGroup
          title={coffeeBarRu.submitted}
          items={submitted}
          busy={busy}
          immutable
          onEdit={onEdit}
          onQuantity={onQuantity}
          onRemove={onRemove}
          onStatus={onStatus}
          canEditDetails={canConfigureItem}
        />
        <ItemGroup
          title={coffeeBarRu.newItems}
          items={drafts}
          busy={busy}
          immutable={terminal(order)}
          onEdit={onEdit}
          onQuantity={onQuantity}
          onRemove={onRemove}
          onStatus={onStatus}
          canEditDetails={canConfigureItem}
        />
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-xs text-slate-500">{coffeeBarRu.total}</span>
          <strong className="text-xl">{currency(order.total)}</strong>
        </div>
        {order.orderType === 'UNASSIGNED' && !terminal(order) && (
          <button
            className={`${primary} w-full`}
            disabled={busy}
            onClick={() => setAttachOpen(true)}
          >
            {coffeeBarRu.attach}
          </button>
        )}
        {drafts.length > 0 && order.orderType !== 'UNASSIGNED' && (
          <button
            className={`${primary} w-full`}
            disabled={busy}
            onClick={() => void onSend()}
          >
            {order.batches.length ? coffeeBarRu.sendAdditional : coffeeBarRu.send}
            <ChevronRight className="size-4" />
          </button>
        )}
        {order.items.length > 0 &&
          drafts.length === 0 &&
          !terminal(order) &&
          order.paymentStatus === 'UNPAID' && (
            <div className="grid grid-cols-2 gap-2">
              {(['CASH', 'CARD'] as const).map((method) => (
                <button
                  key={method}
                  className={secondary}
                  disabled={busy}
                  onClick={() => void onPayment(method)}
                >
                  {coffeePaymentMethodRu[method]}
                </button>
              ))}
            </div>
          )}
        {canComplete && !terminal(order) && (
          <button
            className={`${primary} mt-2 w-full`}
            disabled={busy}
            onClick={() => void onComplete()}
          >
            <Check className="size-4" />
            {order.orderType === 'TABLE'
              ? coffeeBarRu.completeTable
              : coffeeBarRu.completeTakeaway}
          </button>
        )}
        {!terminal(order) && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {order.orderType !== 'UNASSIGNED' && (
              <button
                className={secondary}
                disabled={busy || freeTables.length === 0}
                onClick={() => setTransferOpen(true)}
              >
                {coffeeBarRu.transfer}
              </button>
            )}
            {order.orderType === 'TABLE' &&
              order.items.length === 0 &&
              order.batches.length === 0 && (
                <button
                  className={secondary}
                  disabled={busy}
                  onClick={() => void onRelease()}
                >
                  {coffeeBarRu.releaseTable}
                </button>
              )}
            <button
              className="min-h-10 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              disabled={busy || order.paymentStatus === 'PAID'}
              onClick={() => setCancelOpen(true)}
            >
              {coffeeBarRu.cancel}
            </button>
          </div>
        )}
      </div>
      {guestOpen && (
        <SeatingDialog
          title={coffeeBarRu.changeGuests}
          initialCount={order.guestCount}
          initialNote={order.seatingNote}
          capacity={
            state.tables.find((table) => table.id === order.tableId)?.seatCount ?? 99
          }
          onClose={() => setGuestOpen(false)}
          onSubmit={(input) => {
            setGuestOpen(false);
            void onGuests(input);
          }}
        />
      )}
      {transferOpen && (
        <TransferDialog
          tables={freeTables}
          guestCount={order.guestCount}
          onClose={() => setTransferOpen(false)}
          onSubmit={(tableId, override) => {
            setTransferOpen(false);
            void onTransfer(tableId, override);
          }}
        />
      )}
      {attachOpen && (
        <AttachDialog
          tables={freeTables}
          onClose={() => setAttachOpen(false)}
          onSubmit={(destination) => {
            setAttachOpen(false);
            void onAssign(destination);
          }}
        />
      )}
      {cancelOpen && (
        <ReasonDialog
          required={order.items.some((item) => item.submittedBatchId)}
          onClose={() => setCancelOpen(false)}
          onSubmit={(reason) => {
            setCancelOpen(false);
            void onCancel(reason);
          }}
        />
      )}
    </>
  );
}

function ItemGroup({
  title,
  items,
  immutable = false,
  busy,
  onEdit,
  onQuantity,
  onRemove,
  onStatus,
  canEditDetails,
}: {
  title: string;
  items: ReadonlyArray<CoffeeOrderItem>;
  immutable?: boolean;
  busy: boolean;
  onEdit: (item: CoffeeOrderItem) => void;
  onQuantity: (item: CoffeeOrderItem, quantity: number) => Promise<void>;
  onRemove: (item: CoffeeOrderItem) => Promise<void>;
  onStatus: (
    item: CoffeeOrderItem,
    status: Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'>,
  ) => Promise<void>;
  canEditDetails: (item: CoffeeOrderItem) => boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const next = nextBarStatus(item.status);
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.productName}</p>
                  <p className="text-[11px] text-slate-500">
                    {coffeePreparationWorkspaceRu[item.preparationWorkspace]} ·{' '}
                    {coffeeOrderItemStatusRu[item.status]}
                  </p>
                </div>
                <strong className="text-sm">
                  {currency(item.finalUnitPrice * item.quantity)}
                </strong>
              </div>
              {(item.modifiers.length > 0 || item.comment || item.variantName) && (
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {[
                    item.variantName,
                    ...item.modifiers.map((modifier) => modifier.optionName),
                    item.comment,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {!immutable ? (
                <div className="mt-2 flex items-center gap-1">
                  <button
                    className="grid size-8 place-items-center rounded-lg border"
                    disabled={busy || item.quantity <= 1}
                    onClick={() => void onQuantity(item, item.quantity - 1)}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    className="grid size-8 place-items-center rounded-lg border"
                    disabled={busy}
                    onClick={() => void onQuantity(item, item.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </button>
                  {canEditDetails(item) && (
                    <button
                      className="ml-auto px-2 text-xs font-semibold text-blue-600"
                      onClick={() => onEdit(item)}
                    >
                      {coffeeBarRu.edit}
                    </button>
                  )}
                  <button
                    className={`${canEditDetails(item) ? '' : 'ml-auto'} grid size-8 place-items-center text-rose-600`}
                    onClick={() => void onRemove(item)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                next &&
                item.preparationWorkspace === 'BAR' && (
                  <button
                    className={`${secondary} mt-2 w-full`}
                    disabled={busy}
                    onClick={() => void onStatus(item, next)}
                  >
                    {coffeeBarRu.nextStatus}: {coffeeOrderItemStatusRu[next]}
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductDialog({
  state,
  product,
  item,
  onClose,
  onSubmit,
}: {
  state: CoffeeBarState;
  product: CoffeeBarState['products'][number];
  item: CoffeeOrderItem | null;
  onClose: () => void;
  onSubmit: (input: CoffeeOrderItemDraftInput) => void;
}) {
  const groups = state.modifierGroups.filter((group) =>
    product.modifierGroupIds.includes(group.id),
  );
  const configurationGroups = groups.filter(
    (group) => group.purpose === 'configuration',
  );
  const additionalGroups = groups.filter((group) => group.purpose === 'additional');
  const [selections, setSelections] = useState<ModifierSelection[]>(
    item?.modifiers.map((modifier) => ({
      modifierGroupId: modifier.modifierGroupId,
      optionName: modifier.optionName,
    })) ?? [],
  );
  const [comment, setComment] = useState(item?.comment ?? '');
  const valid = groups.every((group) => {
    const count = selections.filter(
      (selection) => selection.modifierGroupId === group.id,
    ).length;
    return (
      count >=
        (group.required
          ? Math.max(1, group.minimumSelections)
          : group.minimumSelections) && count <= group.maximumSelections
    );
  });

  function toggle(group: CoffeeBarState['modifierGroups'][number], optionName: string) {
    const checked = selections.some(
      (selection) =>
        selection.modifierGroupId === group.id && selection.optionName === optionName,
    );
    const withoutOption = selections.filter(
      (selection) =>
        selection.modifierGroupId !== group.id || selection.optionName !== optionName,
    );
    if (checked) {
      if (!group.required || group.selectionType === 'multiple') {
        setSelections(withoutOption);
      }
      return;
    }
    if (group.selectionType === 'single') {
      setSelections([
        ...selections.filter((selection) => selection.modifierGroupId !== group.id),
        { modifierGroupId: group.id, optionName },
      ]);
      return;
    }
    const groupCount = selections.filter(
      (selection) => selection.modifierGroupId === group.id,
    ).length;
    if (groupCount < group.maximumSelections) {
      setSelections([...selections, { modifierGroupId: group.id, optionName }]);
    }
  }

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="space-y-4">
        {configurationGroups.map((group) => (
          <ModifierOptionGroup
            key={group.id}
            group={group}
            selections={selections}
            onToggle={(optionName) => toggle(group, optionName)}
          />
        ))}
        {additionalGroups.length > 0 && (
          <section className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold">{coffeeBarRu.additional}</h3>
            <div className="mt-3 space-y-4">
              {additionalGroups.map((group) => (
                <ModifierOptionGroup
                  key={group.id}
                  group={group}
                  selections={selections}
                  showLegend={group.name !== coffeeBarRu.additional}
                  onToggle={(optionName) => toggle(group, optionName)}
                />
              ))}
            </div>
          </section>
        )}
        <label className="block text-sm font-medium">
          {coffeeBarRu.comment}
          <textarea
            className={`${control} mt-1 min-h-20 w-full py-2`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={coffeeBarRu.commentPlaceholder}
          />
        </label>
        <button
          className={`${primary} w-full`}
          disabled={!valid}
          onClick={() =>
            onSubmit({
              productId: product.id,
              modifiers: selections,
              comment,
            })
          }
        >
          {item ? coffeeBarRu.edit : coffeeBarRu.add}
        </button>
      </div>
    </Modal>
  );
}

function ModifierOptionGroup({
  group,
  selections,
  showLegend = true,
  onToggle,
}: {
  group: CoffeeBarState['modifierGroups'][number];
  selections: ReadonlyArray<ModifierSelection>;
  showLegend?: boolean;
  onToggle: (optionName: string) => void;
}) {
  const selectionCount = selections.filter(
    (selection) => selection.modifierGroupId === group.id,
  ).length;
  return (
    <fieldset>
      <legend className={showLegend ? 'text-sm font-semibold' : 'sr-only'}>
        {group.name}
        {group.required && <span className="ml-1 text-rose-600">*</span>}
      </legend>
      {showLegend && (
        <p className="mb-2 text-xs text-slate-500">
          {group.required
            ? coffeeBarRu.requiredOption
            : group.maximumSelections === 1
              ? coffeeBarRu.optionalOption
              : coffeeBarRu.maximumOptions(group.maximumSelections)}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {group.options.map((option) => {
          const checked = selections.some(
            (selection) =>
              selection.modifierGroupId === group.id &&
              selection.optionName === option.name,
          );
          const limitReached =
            !checked &&
            group.selectionType === 'multiple' &&
            selectionCount >= group.maximumSelections;
          return (
            <button
              key={option.name}
              type="button"
              aria-pressed={checked}
              disabled={limitReached}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition disabled:opacity-40 ${
                checked
                  ? 'border-blue-200 bg-blue-50/80 text-blue-950'
                  : 'border-slate-200 bg-white hover:border-blue-200'
              }`}
              onClick={() => onToggle(option.name)}
            >
              <span>{option.name}</span>
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                  checked
                    ? 'border-blue-300 bg-blue-100 text-blue-700'
                    : 'border-slate-300 text-transparent'
                }`}
              >
                <Check className="size-3" />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SeatingDialog({
  title,
  capacity,
  initialCount = 1,
  initialNote = '',
  onClose,
  onSubmit,
}: {
  title: string;
  capacity: number;
  initialCount?: number;
  initialNote?: string;
  onClose: () => void;
  onSubmit: (input: CoffeeSeatingInput) => void;
}) {
  const [count, setCount] = useState(initialCount);
  const [note, setNote] = useState(initialNote);
  const [override, setOverride] = useState(false);
  const over = count > capacity;
  return (
    <Modal title={title} onClose={onClose}>
      <label className="block text-sm font-medium">
        {coffeeBarRu.guestCount}
        <input
          type="number"
          min={1}
          className={`${control} mt-1 w-full`}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">Вместимость: {capacity}</p>
      {over && (
        <label className="mt-3 flex items-center gap-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={override}
            onChange={(event) => setOverride(event.target.checked)}
          />
          {coffeeBarRu.capacityOverride}
        </label>
      )}
      <label className="mt-4 block text-sm font-medium">
        {coffeeBarRu.seatingNote}
        <textarea
          className={`${control} mt-1 min-h-20 w-full py-2`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button
        className={`${primary} mt-4 w-full`}
        disabled={!Number.isInteger(count) || count < 1 || (over && !override)}
        onClick={() =>
          onSubmit({ guestCount: count, note, allowCapacityOverride: override })
        }
      >
        {coffeeBarRu.seatGuests}
      </button>
    </Modal>
  );
}

function AttachDialog({
  tables,
  onClose,
  onSubmit,
}: {
  tables: CoffeeBarState['tables'];
  onClose: () => void;
  onSubmit: (destination: OrderAssignment) => void;
}) {
  const [tableId, setTableId] = useState(tables[0]?.id ?? '');
  const [guestCount, setGuestCount] = useState(1);
  const [note, setNote] = useState('');
  const table = tables.find((candidate) => candidate.id === tableId);
  const [override, setOverride] = useState(false);
  const over = Boolean(table && guestCount > table.seatCount);
  return (
    <Modal title={coffeeBarRu.attach} onClose={onClose}>
      <button
        className={`${secondary} w-full`}
        onClick={() => onSubmit({ type: 'TAKEAWAY' })}
      >
        {coffeeBarRu.attachAsTakeaway}
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        или
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <label className="block text-sm font-medium">
        Стол
        <select
          className={`${control} mt-1 w-full`}
          value={tableId}
          onChange={(event) => setTableId(event.target.value)}
        >
          {tables.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} · {candidate.seatCount} мест
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">
        {coffeeBarRu.guestCount}
        <input
          type="number"
          min={1}
          className={`${control} mt-1 w-full`}
          value={guestCount}
          onChange={(event) => setGuestCount(Number(event.target.value))}
        />
      </label>
      <label className="mt-3 block text-sm font-medium">
        {coffeeBarRu.seatingNote}
        <input
          className={`${control} mt-1 w-full`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      {over && (
        <label className="mt-3 flex items-center gap-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={override}
            onChange={(event) => setOverride(event.target.checked)}
          />
          {coffeeBarRu.capacityOverride}
        </label>
      )}
      <button
        className={`${primary} mt-4 w-full`}
        disabled={
          !tableId ||
          !Number.isInteger(guestCount) ||
          guestCount < 1 ||
          (over && !override)
        }
        onClick={() =>
          onSubmit({
            type: 'TABLE',
            tableId,
            seating: {
              guestCount,
              note,
              allowCapacityOverride: override,
            },
          })
        }
      >
        {coffeeBarRu.attachToTable}
      </button>
    </Modal>
  );
}

function TransferDialog({
  tables,
  guestCount,
  onClose,
  onSubmit,
}: {
  tables: CoffeeBarState['tables'];
  guestCount: number;
  onClose: () => void;
  onSubmit: (tableId: string, override: boolean) => void;
}) {
  const [tableId, setTableId] = useState(tables[0]?.id ?? '');
  const table = tables.find((candidate) => candidate.id === tableId);
  const [override, setOverride] = useState(false);
  const over = Boolean(table && guestCount > table.seatCount);
  return (
    <Modal title={coffeeBarRu.transfer} onClose={onClose}>
      <select
        className={`${control} w-full`}
        value={tableId}
        onChange={(event) => setTableId(event.target.value)}
      >
        {tables.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name} · {candidate.seatCount} мест
          </option>
        ))}
      </select>
      {over && (
        <label className="mt-3 flex items-center gap-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={override}
            onChange={(event) => setOverride(event.target.checked)}
          />
          {coffeeBarRu.capacityOverride}
        </label>
      )}
      <button
        className={`${primary} mt-4 w-full`}
        disabled={!tableId || (over && !override)}
        onClick={() => onSubmit(tableId, override)}
      >
        {coffeeBarRu.transfer}
      </button>
    </Modal>
  );
}

function ReasonDialog({
  required,
  onClose,
  onSubmit,
}: {
  required: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={coffeeBarRu.cancel} onClose={onClose}>
      <label className="block text-sm font-medium">
        {coffeeBarRu.cancellationReason}
        <textarea
          className={`${control} mt-1 min-h-24 w-full py-2`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button
        className="mt-4 min-h-10 w-full rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
        disabled={required && !reason.trim()}
        onClick={() => onSubmit(reason)}
      >
        {coffeeBarRu.cancel}
      </button>
    </Modal>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white bg-white/95 shadow-[0_18px_50px_rgba(30,64,175,.08)] lg:min-h-0">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </article>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            className="grid size-9 place-items-center rounded-full hover:bg-slate-100"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Category({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-pressed={active}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="p-6 text-center text-sm text-slate-500">{children}</p>;
}
