'use client';

import {
  Check,
  ChevronRight,
  Coffee,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type {
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeOrder,
  CoffeeOrderItem,
  CoffeeOrderItemStatus,
  CoffeePaymentStatus,
} from './bar-domain';
import { localCoffeeBarOrderRepository } from './bar-local-repository';
import {
  coffeeBarErrorRu,
  coffeeBarRu,
  coffeeOrderItemStatusRu,
  coffeeOrderStatusRu,
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

const controlClass =
  'min-h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,.18)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45';

function currency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function itemTotal(item: CoffeeOrderItem): number {
  return (
    (item.unitPrice +
      item.modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0)) *
    item.quantity
  );
}

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
  const [categoryId, setCategoryId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await service.load(context);
      setState(next);
      setMessage(null);
      setSelectedOrderId((current) => {
        if (current && next.orders.some((order) => order.orderId === current)) {
          return current;
        }
        return (
          next.orders.find(
            (order) => order.status !== 'ISSUED' && order.status !== 'CANCELLED',
          )?.orderId ?? null
        );
      });
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
    const unsubscribe = service.subscribe(context, () => {
      void reload();
    });
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

  if (!state) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-blue-950/5">
        <Coffee className="mx-auto size-10 text-blue-600" />
        <p className="mt-5 text-lg font-semibold">{message ?? coffeeBarRu.loading}</p>
        {message && (
          <button className={`${secondaryButton} mt-6`} onClick={() => void reload()}>
            {coffeeBarRu.retry}
          </button>
        )}
      </section>
    );
  }

  const openOrders = state.orders.filter(
    (order) => order.status !== 'ISSUED' && order.status !== 'CANCELLED',
  );
  const readyOrders = openOrders.filter((order) => order.status === 'READY');
  const issuedOrders = state.orders
    .filter((order) => order.status === 'ISSUED')
    .slice(-6)
    .reverse();
  const selectedOrder = state.orders.find((order) => order.orderId === selectedOrderId);
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  const products = state.products.filter(
    (product) =>
      (categoryId === 'all' || product.categoryId === categoryId) &&
      (!normalizedQuery ||
        product.name.toLocaleLowerCase('ru-RU').includes(normalizedQuery)),
  );

  async function selectTable(table: CoffeeBarState['tables'][number]): Promise<void> {
    if (table.activeOrderId) {
      setSelectedOrderId(table.activeOrderId);
      return;
    }
    await run(() => service.createTableOrder(context, table.id));
  }

  return (
    <section className="w-full">
      <div className="rounded-[30px] border border-white/90 bg-white/90 p-5 shadow-[0_24px_70px_rgba(30,64,175,.1)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              {coffeeBarRu.eyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {coffeeBarRu.title}
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {state.establishmentName} · {state.locationName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InfoPill label={coffeeBarRu.activeEmployee} value={state.employeeName} />
            <InfoPill label={coffeeBarRu.location} value={state.locationName} />
            <button
              className={primaryButton}
              disabled={busy}
              onClick={() => void run(() => service.createTakeawayOrder(context))}
            >
              <ShoppingBag className="size-4" />
              {coffeeBarRu.newTakeaway}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label={coffeeBarRu.openOrders} value={openOrders.length} />
          <Metric label={coffeeBarRu.readyOrders} value={readyOrders.length} />
          <Metric label={coffeeBarRu.recentIssued} value={issuedOrders.length} />
          <Metric label={coffeeBarRu.activeEmployee} value={state.employeeName} />
        </div>
      </div>

      {message && (
        <div
          role="alert"
          className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
        >
          {message}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,.7fr)]">
        <div className="space-y-5">
          <Surface
            title={coffeeBarRu.tables}
            description={
              state.tables.length > 0 ? coffeeBarRu.tableHint : coffeeBarRu.noTables
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {state.tables.map((table) => (
                <button
                  key={table.id}
                  className={`min-h-28 rounded-[20px] border p-4 text-left transition ${
                    table.activeOrderId === selectedOrderId
                      ? 'border-blue-500 bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,.12)]'
                      : table.status === 'FREE'
                        ? 'border-slate-200 bg-white hover:border-blue-300'
                        : table.status === 'UNPAID'
                          ? 'border-amber-200 bg-amber-50'
                          : table.status === 'READY'
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-indigo-200 bg-indigo-50'
                  }`}
                  onClick={() => void selectTable(table)}
                >
                  <span className="block text-base font-semibold text-slate-950">
                    {table.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {table.seats} · {table.code}
                  </span>
                  <span className="mt-4 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                    {coffeeTableStatusRu[table.status]}
                  </span>
                </button>
              ))}
            </div>
          </Surface>

          <Surface title={coffeeBarRu.openOrders}>
            {openOrders.length === 0 ? (
              <Empty>{coffeeBarRu.noOpenOrders}</Empty>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {openOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    active={order.orderId === selectedOrderId}
                    onClick={() => setSelectedOrderId(order.orderId)}
                    tableName={
                      state.tables.find((table) => table.id === order.tableId)?.name
                    }
                  />
                ))}
              </div>
            )}
          </Surface>

          <Surface title={coffeeBarRu.recentIssued}>
            {issuedOrders.length === 0 ? (
              <Empty>{coffeeBarRu.noIssuedOrders}</Empty>
            ) : (
              <div className="divide-y divide-slate-100">
                {issuedOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    active={false}
                    onClick={() => setSelectedOrderId(order.orderId)}
                    tableName={
                      state.tables.find((table) => table.id === order.tableId)?.name
                    }
                  />
                ))}
              </div>
            )}
          </Surface>
        </div>

        <div className="xl:sticky xl:top-5 xl:self-start">
          {selectedOrder ? (
            <OrderPanel
              order={selectedOrder}
              state={state}
              products={products}
              categoryId={categoryId}
              query={query}
              busy={busy}
              onCategory={setCategoryId}
              onQuery={setQuery}
              onAdd={(productId) =>
                run(() =>
                  service.addItem(context, selectedOrder.orderId, { productId }),
                )
              }
              onQuantity={(itemId, quantity) =>
                run(() =>
                  service.updateItemQuantity(
                    context,
                    selectedOrder.orderId,
                    itemId,
                    quantity,
                  ),
                )
              }
              onRemove={(itemId) =>
                run(() => service.removeItem(context, selectedOrder.orderId, itemId))
              }
              onDetails={(itemId, modifiers, comment) =>
                run(() =>
                  service.updateItemDetails(context, selectedOrder.orderId, itemId, {
                    modifiers,
                    comment,
                  }),
                )
              }
              onSend={() =>
                run(() => service.sendOrder(context, selectedOrder.orderId))
              }
              onStatus={(itemId, status) =>
                run(() =>
                  service.updateBarItemStatus(
                    context,
                    selectedOrder.orderId,
                    itemId,
                    status,
                  ),
                )
              }
              onPayment={(status) =>
                run(() => service.setPayment(context, selectedOrder.orderId, status))
              }
              onIssue={() =>
                run(() => service.issueOrder(context, selectedOrder.orderId))
              }
              onCancel={() => {
                if (window.confirm(coffeeBarRu.cancelConfirm)) {
                  void run(() => service.cancelOrder(context, selectedOrder.orderId));
                }
              }}
            />
          ) : (
            <Surface title={coffeeBarRu.composition}>
              <Empty>{coffeeBarRu.selectOrder}</Empty>
            </Surface>
          )}
          <p className="mt-3 text-center font-mono text-[11px] tracking-[0.08em] text-slate-400">
            {accessCode}
          </p>
        </div>
      </div>
    </section>
  );
}

function OrderPanel({
  order,
  state,
  products,
  categoryId,
  query,
  busy,
  onCategory,
  onQuery,
  onAdd,
  onQuantity,
  onRemove,
  onDetails,
  onSend,
  onStatus,
  onPayment,
  onIssue,
  onCancel,
}: {
  order: CoffeeOrder;
  state: CoffeeBarState;
  products: CoffeeBarState['products'];
  categoryId: string;
  query: string;
  busy: boolean;
  onCategory: (value: string) => void;
  onQuery: (value: string) => void;
  onAdd: (productId: string) => Promise<void>;
  onQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  onDetails: (
    itemId: string,
    modifiers: ReadonlyArray<{
      modifierGroupId: string;
      optionName: string;
    }>,
    comment: string,
  ) => Promise<void>;
  onSend: () => Promise<void>;
  onStatus: (
    itemId: string,
    status: Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'>,
  ) => Promise<void>;
  onPayment: (status: CoffeePaymentStatus) => Promise<void>;
  onIssue: () => Promise<void>;
  onCancel: () => void;
}) {
  const editable = order.status === 'DRAFT';
  return (
    <Surface
      title={`${coffeeBarRu.order} ${order.orderNumber}`}
      description={`${order.orderType === 'TAKEAWAY' ? coffeeBarRu.takeaway : coffeeBarRu.table} · ${coffeeOrderStatusRu[order.status]}`}
    >
      {editable && (
        <div className="mb-5 border-b border-slate-100 pb-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder={coffeeBarRu.searchProducts}
              className={`${controlClass} w-full pl-10`}
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <CategoryButton
              active={categoryId === 'all'}
              onClick={() => onCategory('all')}
            >
              {coffeeBarRu.allCategories}
            </CategoryButton>
            {state.categories.map((category) => (
              <CategoryButton
                key={category.id}
                active={categoryId === category.id}
                onClick={() => onCategory(category.id)}
              >
                {category.name}
              </CategoryButton>
            ))}
          </div>
          <div className="mt-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {products.map((product) => (
              <button
                key={product.id}
                className="rounded-[14px] border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                disabled={busy}
                onClick={() => void onAdd(product.id)}
              >
                <span className="block text-sm font-semibold text-slate-950">
                  {product.name}
                </span>
                <span className="mt-2 block text-xs font-bold text-blue-600">
                  {currency(product.price)}
                </span>
              </button>
            ))}
            {products.length === 0 && (
              <p className="col-span-2 py-6 text-center text-sm text-slate-500">
                {coffeeBarRu.noProducts}
              </p>
            )}
          </div>
        </div>
      )}

      {order.items.length === 0 ? (
        <Empty>{coffeeBarRu.emptyOrder}</Empty>
      ) : (
        <div className="space-y-3">
          {order.items.map((item) => (
            <OrderItemEditor
              key={`${item.id}:${item.comment}`}
              item={item}
              state={state}
              editable={editable}
              busy={busy}
              onQuantity={(quantity) => onQuantity(item.id, quantity)}
              onRemove={() => onRemove(item.id)}
              onDetails={(modifiers, comment) => onDetails(item.id, modifiers, comment)}
              onStatus={(status) => onStatus(item.id, status)}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
        <span className="text-sm text-slate-500">{coffeeBarRu.total}</span>
        <span className="text-2xl font-semibold tracking-[-0.04em]">
          {currency(order.total)}
        </span>
      </div>

      {order.status === 'DRAFT' && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            className={primaryButton}
            disabled={busy || order.items.length === 0}
            onClick={() => void onSend()}
          >
            {coffeeBarRu.send}
            <ChevronRight className="size-4" />
          </button>
          <button className={secondaryButton} disabled={busy} onClick={onCancel}>
            {coffeeBarRu.cancel}
          </button>
        </div>
      )}

      {order.status !== 'DRAFT' &&
        order.status !== 'CANCELLED' &&
        order.status !== 'ISSUED' && (
          <div className="mt-5 rounded-[16px] bg-slate-50 p-4">
            <p className="text-sm font-semibold">{coffeeBarRu.payment}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {coffeeBarRu.paymentNotice}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['UNPAID', 'CASH', 'CARD'] as const).map((status) => (
                <button
                  key={status}
                  disabled={busy}
                  className={`min-h-10 rounded-[12px] border px-2 text-xs font-semibold ${
                    order.paymentStatus === status
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  onClick={() => void onPayment(status)}
                >
                  {coffeePaymentStatusRu[status]}
                </button>
              ))}
            </div>
            {order.status === 'READY' && (
              <button
                className={`${primaryButton} mt-3 w-full`}
                disabled={busy || order.paymentStatus === 'UNPAID'}
                onClick={() => void onIssue()}
              >
                <Check className="size-4" />
                {coffeeBarRu.issue}
              </button>
            )}
          </div>
        )}
    </Surface>
  );
}

function OrderItemEditor({
  item,
  state,
  editable,
  busy,
  onQuantity,
  onRemove,
  onDetails,
  onStatus,
}: {
  item: CoffeeOrderItem;
  state: CoffeeBarState;
  editable: boolean;
  busy: boolean;
  onQuantity: (quantity: number) => Promise<void>;
  onRemove: () => Promise<void>;
  onDetails: (
    modifiers: ReadonlyArray<{
      modifierGroupId: string;
      optionName: string;
    }>,
    comment: string,
  ) => Promise<void>;
  onStatus: (
    status: Exclude<CoffeeOrderItemStatus, 'DRAFT' | 'CANCELLED'>,
  ) => Promise<void>;
}) {
  const [comment, setComment] = useState(item.comment);
  const product = state.products.find((candidate) => candidate.id === item.productId);
  const groups = state.modifierGroups.filter((group) =>
    product?.modifierGroupIds.includes(group.id),
  );
  const selectedModifiers = item.modifiers.map((modifier) => ({
    modifierGroupId: modifier.modifierGroupId,
    optionName: modifier.optionName,
  }));
  const next = nextBarStatus(item.status);

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{item.productName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {coffeePreparationWorkspaceRu[item.preparationWorkspace]} ·{' '}
            {coffeeOrderItemStatusRu[item.status]}
          </p>
        </div>
        <span className="text-sm font-semibold">{currency(itemTotal(item))}</span>
      </div>

      {editable ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            <button
              aria-label={coffeeBarRu.quantity}
              className="grid size-9 place-items-center rounded-[11px] border border-slate-200"
              disabled={busy || item.quantity <= 1}
              onClick={() => void onQuantity(item.quantity - 1)}
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              aria-label={coffeeBarRu.quantity}
              className="grid size-9 place-items-center rounded-[11px] border border-slate-200"
              disabled={busy}
              onClick={() => void onQuantity(item.quantity + 1)}
            >
              <Plus className="size-4" />
            </button>
            <button
              className="ml-auto grid size-9 place-items-center rounded-[11px] text-rose-600 hover:bg-rose-50"
              aria-label={coffeeBarRu.remove}
              disabled={busy}
              onClick={() => void onRemove()}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {groups.map((group) => (
            <label key={group.id} className="mt-3 block">
              <span className="text-xs font-medium text-slate-500">{group.name}</span>
              <select
                className={`${controlClass} mt-1 w-full`}
                value={
                  selectedModifiers.find(
                    (modifier) => modifier.modifierGroupId === group.id,
                  )?.optionName ?? ''
                }
                onChange={(event) => {
                  const others = selectedModifiers.filter(
                    (modifier) => modifier.modifierGroupId !== group.id,
                  );
                  const nextModifiers = event.target.value
                    ? [
                        ...others,
                        {
                          modifierGroupId: group.id,
                          optionName: event.target.value,
                        },
                      ]
                    : others;
                  void onDetails(nextModifiers, comment);
                }}
              >
                <option value="">{coffeeBarRu.modifierNone}</option>
                {group.options.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="mt-3 block">
            <span className="text-xs font-medium text-slate-500">
              {coffeeBarRu.comment}
            </span>
            <input
              className={`${controlClass} mt-1 w-full`}
              value={comment}
              placeholder={coffeeBarRu.commentPlaceholder}
              onChange={(event) => setComment(event.target.value)}
              onBlur={() => {
                if (comment !== item.comment) {
                  void onDetails(selectedModifiers, comment);
                }
              }}
            />
          </label>
        </>
      ) : (
        <>
          {item.modifiers.length > 0 && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {item.modifiers.map((modifier) => modifier.optionName).join(' · ')}
            </p>
          )}
          {item.comment && (
            <p className="mt-2 rounded-[10px] bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {item.comment}
            </p>
          )}
          {item.preparationWorkspace === 'BAR' && next && (
            <button
              className={`${secondaryButton} mt-3 w-full`}
              disabled={busy}
              onClick={() => void onStatus(next)}
            >
              {coffeeBarRu.nextStatus}: {coffeeOrderItemStatusRu[next]}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Surface({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,.05)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="mt-0.5 block max-w-52 truncate text-xs font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function CategoryButton({
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
      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function OrderRow({
  order,
  active,
  onClick,
  tableName,
}: {
  order: CoffeeOrder;
  active: boolean;
  onClick: () => void;
  tableName: string | undefined;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-[15px] p-3 text-left transition ${
        active ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white text-blue-600 shadow-sm">
        {order.orderType === 'TAKEAWAY' ? (
          <ShoppingBag className="size-4" />
        ) : (
          <UsersRound className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {order.orderNumber} · {tableName ?? coffeeBarRu.takeaway}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {coffeeOrderStatusRu[order.status]} · {formatTime(order.updatedAt)}
        </span>
      </span>
      <span className="text-sm font-semibold">{currency(order.total)}</span>
    </button>
  );
}
