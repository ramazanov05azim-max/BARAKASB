'use client';

import {
  Check,
  ChevronRight,
  Coffee,
  History,
  Minus,
  Plus,
  Search,
  ShoppingBag,
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
  accessCode,
  service = defaultService,
}: {
  context: CoffeeBarRuntimeContext;
  accessCode: string;
  service?: CoffeeBarService;
}) {
  const [state, setState] = useState<CoffeeBarState | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seatingTable, setSeatingTable] = useState<
    CoffeeBarState['tables'][number] | null
  >(null);
  const [product, setProduct] = useState<CoffeeBarState['products'][number] | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<CoffeeOrderItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
          : (next.orders.find((order) => !terminal(order))?.orderId ?? null),
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
  const history = state.orders.filter(terminal).slice().reverse();

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
        <div className="flex gap-2">
          <button className={secondary} onClick={() => setHistoryOpen(true)}>
            <History className="size-4" />
            <span className="hidden sm:inline">{coffeeBarRu.history}</span>
          </button>
          <button
            className={primary}
            disabled={busy}
            onClick={() => void run(() => service.createTakeawayOrder(context))}
          >
            <ShoppingBag className="size-4" />
            {coffeeBarRu.newTakeaway}
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

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(230px,.72fr)_minmax(330px,1.05fr)_minmax(310px,.9fr)]">
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
                className="relative min-h-[300px] w-full overflow-hidden rounded-2xl border border-blue-100 bg-[radial-gradient(circle_at_20%_20%,#eff6ff,white_55%)]"
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
                        if (table.activeOrderId)
                          setSelectedOrderId(table.activeOrderId);
                        else setSeatingTable(table);
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
          <div className="border-t border-slate-100 p-3">
            <p className="text-[11px] text-slate-500">{coffeeBarRu.tableHint}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.orders
                .filter((order) => !terminal(order))
                .map((order) => (
                  <button
                    key={order.orderId}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                      order.orderId === selectedOrderId
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200'
                    }`}
                    onClick={() => setSelectedOrderId(order.orderId)}
                  >
                    {order.orderNumber}
                  </button>
                ))}
            </div>
          </div>
        </Panel>

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
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 pt-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {products.map((candidate) => (
              <button
                key={candidate.id}
                disabled={
                  !selectedOrder ||
                  terminal(selectedOrder) ||
                  selectedOrder.paymentStatus === 'PAID'
                }
                className="min-h-24 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                onClick={() => setProduct(candidate)}
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

        <Panel
          title={
            selectedOrder
              ? `${coffeeBarRu.order} ${selectedOrder.orderNumber}`
              : coffeeBarRu.composition
          }
        >
          {selectedOrder ? (
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
            />
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <Empty>{coffeeBarRu.selectOrder}</Empty>
            </div>
          )}
          <p className="border-t border-slate-100 px-3 py-2 text-center font-mono text-[10px] tracking-wider text-slate-400">
            {accessCode}
          </p>
        </Panel>
      </div>

      {seatingTable && (
        <SeatingDialog
          title={seatingTable.name}
          capacity={seatingTable.seatCount}
          onClose={() => setSeatingTable(null)}
          onSubmit={(input) => {
            setSeatingTable(null);
            void run(() => service.createTableOrder(context, seatingTable.id, input));
          }}
        />
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
      {historyOpen && (
        <Modal title={coffeeBarRu.history} onClose={() => setHistoryOpen(false)}>
          <div className="max-h-[65vh] space-y-2 overflow-y-auto">
            {history.map((order) => (
              <div
                key={order.orderId}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex justify-between gap-3">
                  <strong>{order.orderNumber}</strong>
                  <span className="text-xs">{coffeeOrderStatusRu[order.status]}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {currency(order.total)}
                  {order.cancellationReason ? ` · ${order.cancellationReason}` : ''}
                </p>
              </div>
            ))}
            {!history.length && <Empty>История пока пуста.</Empty>}
          </div>
        </Modal>
      )}
    </section>
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
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const submitted = order.items.filter((item) => item.submittedBatchId);
  const drafts = order.items.filter((item) => !item.submittedBatchId);
  const canComplete =
    order.paymentStatus === 'PAID' &&
    order.items.length > 0 &&
    order.items.every((item) => item.status === 'READY');
  const freeTables = state.tables.filter(
    (table) => table.status === 'FREE' && table.id !== order.tableId,
  );
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
        />
        <ItemGroup
          title={coffeeBarRu.newItems}
          items={drafts}
          busy={busy}
          onEdit={onEdit}
          onQuantity={onQuantity}
          onRemove={onRemove}
          onStatus={onStatus}
        />
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-xs text-slate-500">{coffeeBarRu.total}</span>
          <strong className="text-xl">{currency(order.total)}</strong>
        </div>
        {drafts.length > 0 && (
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
        {canComplete && (
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
            {order.orderType === 'TABLE' && (
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
                  <button
                    className="ml-auto px-2 text-xs font-semibold text-blue-600"
                    onClick={() => onEdit(item)}
                  >
                    {coffeeBarRu.edit}
                  </button>
                  <button
                    className="grid size-8 place-items-center text-rose-600"
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
  const [selections, setSelections] = useState(
    item?.modifiers.map((modifier) => ({
      modifierGroupId: modifier.modifierGroupId,
      optionName: modifier.optionName,
    })) ?? [],
  );
  const [comment, setComment] = useState(item?.comment ?? '');
  const [variantName, setVariantName] = useState(item?.variantName ?? '');
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
  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          Вариант
          <input
            className={`${control} mt-1 w-full`}
            value={variantName}
            onChange={(event) => setVariantName(event.target.value)}
            placeholder="Например: большой"
          />
        </label>
        {groups.map((group) => (
          <fieldset key={group.id}>
            <legend className="text-sm font-semibold">
              {group.name}
              {group.required && <span className="ml-1 text-rose-600">*</span>}
            </legend>
            <p className="mb-2 text-xs text-slate-500">
              Выберите от {group.minimumSelections} до {group.maximumSelections}
            </p>
            <div className="space-y-2">
              {group.options.map((option) => {
                const checked = selections.some(
                  (selection) =>
                    selection.modifierGroupId === group.id &&
                    selection.optionName === option.name,
                );
                return (
                  <label
                    key={option.name}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <span className="text-sm">{option.name}</span>
                    <input
                      type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                      name={group.id}
                      checked={checked}
                      onChange={() => {
                        const others = selections.filter(
                          (selection) =>
                            selection.modifierGroupId !== group.id ||
                            (group.selectionType === 'multiple' &&
                              selection.optionName !== option.name),
                        );
                        setSelections(
                          checked && group.selectionType === 'multiple'
                            ? others
                            : [
                                ...others,
                                { modifierGroupId: group.id, optionName: option.name },
                              ],
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
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
              variantName,
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
