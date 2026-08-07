'use client';

import React, {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  PurchaseDelivery,
  PurchaseNeed,
  PurchaserRuntimeContext,
  PurchaserState,
  SupplierOrder,
} from './domain';
import {
  localCoffeePurchaserService,
  type CoffeePurchaserService,
  type SupplierOrderInput,
} from './service';

const sections = [
  ['needs', 'Потребность'],
  ['orders', 'Заказы поставщикам'],
  ['deliveries', 'Поставки'],
  ['suppliers', 'Поставщики'],
  ['history', 'История'],
] as const;
type Section = (typeof sections)[number][0];

const inputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40';
const secondaryClass =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const dangerClass =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100';

const needStatus = {
  OUT_OF_STOCK: 'Нет в наличии',
  BELOW_MINIMUM: 'Ниже минимума',
  SUFFICIENT: 'Достаточно',
  NEGATIVE: 'Отрицательный остаток',
} as const;
const orderStatus = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  PARTIALLY_DELIVERED: 'Частично поставлен',
  DELIVERED: 'Поставлен',
  CANCELLED: 'Отменён',
} as const;
const deliveryStatus = {
  DRAFT: 'Черновик',
  POSTED: 'Проведён',
  CANCELLED: 'Отменён',
} as const;

function formatQuantity(value: number, unit: 'g' | 'ml' | 'pc'): string {
  if (unit === 'g' && Math.abs(value) >= 1000)
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value / 1000)} кг`;
  if (unit === 'ml' && Math.abs(value) >= 1000)
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value / 1000)} л`;
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)} ${unit === 'pc' ? 'шт' : unit === 'ml' ? 'мл' : 'г'}`;
}

function formatMoney(value: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function receivedForLine(
  state: PurchaserState,
  order: SupplierOrder,
  orderLineId: string,
): number {
  return state.deliveries
    .filter(
      (delivery) =>
        delivery.supplierOrderId === order.orderId && delivery.status === 'POSTED',
    )
    .flatMap((delivery) => delivery.lines)
    .filter((line) => line.orderLineId === orderLineId)
    .reduce((sum, line) => sum + line.deliveredQuantityPurchaseUnit, 0);
}

export function CoffeePurchaserWorkspaceScreen({
  context,
  onLogoutEmployee,
  service = localCoffeePurchaserService,
}: {
  readonly context: PurchaserRuntimeContext;
  readonly onLogoutEmployee?: () => void;
  readonly service?: CoffeePurchaserService;
}) {
  const [section, setSection] = useState<Section>('needs');
  const [state, setState] = useState<PurchaserState | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [needWarehouse, setNeedWarehouse] = useState('');
  const [needState, setNeedState] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderWarehouseId, setOrderWarehouseId] = useState('');
  const [orderExpectedAt, setOrderExpectedAt] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [orderLines, setOrderLines] = useState<
    Record<string, { quantity: string; price: string }>
  >({});
  const [activeDelivery, setActiveDelivery] = useState<PurchaseDelivery | null>(null);
  const [deliveryValues, setDeliveryValues] = useState<
    Record<string, { quantity: string; price: string }>
  >({});
  const [supplierReference, setSupplierReference] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [deliveryComment, setDeliveryComment] = useState('');
  const [confirmOverdelivery, setConfirmOverdelivery] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingAssortmentId, setEditingAssortmentId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    comment: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [assortmentForm, setAssortmentForm] = useState({
    supplierId: '',
    resourceId: '',
    supplierProductName: '',
    supplierSku: '',
    lastKnownPrice: '',
    preferred: false,
    active: true,
  });
  const [historyFilters, setHistoryFilters] = useState({
    search: '',
    supplier: '',
    warehouse: '',
    resource: '',
    employee: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const reload = useCallback(async () => {
    try {
      setState(await service.load(context));
      setError('');
    } catch {
      setError(
        'Не удалось загрузить закупки. Проверьте назначения рабочего пространства.',
      );
    }
  }, [context, service]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    const unsubscribe = service.subscribe(context, () => void reload());
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [context, reload, service]);

  async function run(action: () => Promise<void>, message: string): Promise<void> {
    setError('');
    setSuccess('');
    try {
      await action();
      await reload();
      setSuccess(message);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(
        code === 'overdelivery-confirmation-required'
          ? 'Количество превышает остаток заказа. Подтвердите перепоставку.'
          : code === 'supplier-in-use'
            ? 'Поставщик используется в ассортименте или документах и не может быть удалён.'
            : code === 'cancellation-reason-required'
              ? 'Укажите причину отмены.'
              : 'Операция не выполнена. Проверьте заполненные данные.',
      );
    }
  }

  function addNeed(need: PurchaseNeed): void {
    setSelectedResources((current) =>
      current.includes(need.resource.resourceId)
        ? current
        : [...current, need.resource.resourceId],
    );
    setOrderWarehouseId(need.warehouseId);
    if (need.preferredSupplier) setOrderSupplierId(need.preferredSupplier.id);
    setOrderLines((current) => ({
      ...current,
      [need.resource.resourceId]: {
        quantity:
          need.recommendedQuantityBase === null
            ? '1'
            : String(
                Math.max(
                  1,
                  Math.ceil(
                    need.recommendedQuantityBase / need.resource.purchasePackageSize,
                  ),
                ),
              ),
        price: String(need.lastPrice?.actualUnitPrice ?? ''),
      },
    }));
    setSection('orders');
  }

  function resetOrderForm(): void {
    setEditingOrderId(null);
    setSelectedResources([]);
    setOrderSupplierId('');
    setOrderWarehouseId('');
    setOrderExpectedAt('');
    setOrderComment('');
    setOrderLines({});
  }

  function editOrder(order: SupplierOrder): void {
    setEditingOrderId(order.orderId);
    setSelectedResources(order.lines.map((line) => line.resourceId));
    setOrderSupplierId(order.supplierId);
    setOrderWarehouseId(order.destinationWarehouseId);
    setOrderExpectedAt(order.expectedDeliveryAt ?? '');
    setOrderComment(order.comment);
    setOrderLines(
      Object.fromEntries(
        order.lines.map((line) => [
          line.resourceId,
          {
            quantity: String(line.orderedQuantityPurchaseUnit),
            price: String(line.expectedUnitPrice),
          },
        ]),
      ),
    );
    setSection('orders');
  }

  async function saveOrder(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!state) return;
    const input: SupplierOrderInput = {
      supplierId: orderSupplierId,
      destinationWarehouseId: orderWarehouseId,
      expectedDeliveryAt: orderExpectedAt || null,
      comment: orderComment,
      lines: selectedResources.map((resourceId) => ({
        resourceId,
        quantityPurchaseUnit: Number(orderLines[resourceId]?.quantity ?? 0),
        expectedUnitPrice: Number(orderLines[resourceId]?.price ?? 0),
      })),
    };
    await run(
      async () => {
        if (editingOrderId)
          await service.updateDraftOrder(context, editingOrderId, input);
        else await service.createOrder(context, input);
        resetOrderForm();
      },
      editingOrderId ? 'Черновик обновлён.' : 'Черновик заказа создан.',
    );
  }

  async function startDelivery(order: SupplierOrder): Promise<void> {
    await run(async () => {
      const draft = await service.createDeliveryDraft(context, order.orderId);
      setActiveDelivery(draft);
      setDeliveryValues(
        Object.fromEntries(
          order.lines.map((line) => [
            line.lineId,
            {
              quantity: String(
                Math.max(
                  0,
                  line.orderedQuantityPurchaseUnit -
                    receivedForLine(state!, order, line.lineId),
                ),
              ),
              price: String(line.expectedUnitPrice),
            },
          ]),
        ),
      );
    }, 'Черновик поставки открыт.');
  }

  async function postDelivery(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!state || !activeDelivery) return;
    const order = state.orders.find(
      (candidate) => candidate.orderId === activeDelivery.supplierOrderId,
    );
    if (!order) return;
    await run(async () => {
      await service.postDelivery(context, activeDelivery.deliveryId, {
        supplierDocumentReference: supplierReference,
        deliveredAt: deliveryDate,
        comment: deliveryComment,
        confirmOverdelivery,
        lines: order.lines.map((line) => ({
          orderLineId: line.lineId,
          quantityPurchaseUnit: Number(deliveryValues[line.lineId]?.quantity ?? 0),
          actualUnitPrice: Number(deliveryValues[line.lineId]?.price ?? 0),
        })),
      });
      setActiveDelivery(null);
      setDeliveryValues({});
      setSupplierReference('');
      setDeliveryComment('');
      setConfirmOverdelivery(false);
    }, 'Поставка проведена, складские остатки обновлены.');
  }

  async function saveSupplier(event: FormEvent): Promise<void> {
    event.preventDefault();
    await run(
      async () => {
        await service.saveSupplier(context, editingSupplierId, supplierForm);
        setEditingSupplierId(null);
        setSupplierForm({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          comment: '',
          status: 'active',
        });
      },
      editingSupplierId ? 'Поставщик обновлён.' : 'Поставщик создан.',
    );
  }

  async function saveAssortment(event: FormEvent): Promise<void> {
    event.preventDefault();
    await run(
      async () => {
        await service.saveAssortment(context, editingAssortmentId, {
          supplierId: assortmentForm.supplierId,
          resourceId: assortmentForm.resourceId,
          supplierProductName: assortmentForm.supplierProductName || null,
          supplierSku: assortmentForm.supplierSku || null,
          lastKnownPrice: assortmentForm.lastKnownPrice
            ? Number(assortmentForm.lastKnownPrice)
            : null,
          preferred: assortmentForm.preferred,
          active: assortmentForm.active,
        });
        setEditingAssortmentId(null);
        setAssortmentForm({
          supplierId: '',
          resourceId: '',
          supplierProductName: '',
          supplierSku: '',
          lastKnownPrice: '',
          preferred: false,
          active: true,
        });
      },
      editingAssortmentId
        ? 'Ассортимент обновлён.'
        : 'Ассортимент поставщика сохранён.',
    );
  }

  const filteredNeeds = useMemo(() => {
    if (!state) return [];
    const term = search.trim().toLocaleLowerCase('ru-RU');
    return state.needs.filter(
      (need) =>
        (!needWarehouse || need.warehouseId === needWarehouse) &&
        (!needState || need.state === needState) &&
        (!term ||
          need.resource.name.toLocaleLowerCase('ru-RU').includes(term) ||
          need.barcode?.toLocaleLowerCase('ru-RU').includes(term)),
    );
  }, [needState, needWarehouse, search, state]);

  if (!state)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        {error || 'Загрузка закупок…'}
      </div>
    );

  const activeDeliveryOrder = activeDelivery
    ? state.orders.find((order) => order.orderId === activeDelivery.supplierOrderId)
    : null;
  const history = [
    ...state.orders.map((order) => ({
      id: order.orderId,
      type: 'ORDER',
      number: order.orderNumber,
      date: order.updatedAt,
      supplierId: order.supplierId,
      supplier: order.supplierNameSnapshot,
      warehouseId: order.destinationWarehouseId,
      warehouse: order.destinationWarehouseNameSnapshot,
      resourceIds: order.lines.map((line) => line.resourceId),
      resources: order.lines.map((line) => line.resourceNameSnapshot).join(', '),
      details: order.lines.map(
        (line) =>
          `${line.resourceNameSnapshot}: ${line.orderedQuantityPurchaseUnit} ${line.purchaseUnitNameSnapshot} × ${formatMoney(line.expectedUnitPrice)} = ${formatMoney(line.expectedLineTotal)}`,
      ),
      reference: '',
      total: order.lines.reduce((sum, line) => sum + line.expectedLineTotal, 0),
      status: orderStatus[order.status],
      employeeId: order.createdByEmployeeId,
    })),
    ...state.deliveries.map((delivery) => ({
      id: delivery.deliveryId,
      type: 'DELIVERY',
      number: delivery.deliveryNumber,
      date: delivery.postedAt ?? delivery.createdAt,
      supplierId: delivery.supplierId,
      supplier: delivery.supplierNameSnapshot,
      warehouseId: delivery.destinationWarehouseId,
      warehouse: delivery.destinationWarehouseNameSnapshot,
      resourceIds: delivery.lines.map((line) => line.resourceId),
      resources: delivery.lines.map((line) => line.resourceNameSnapshot).join(', '),
      details: delivery.lines.map(
        (line) =>
          `${line.resourceNameSnapshot}: ${line.deliveredQuantityPurchaseUnit} ${line.purchaseUnitNameSnapshot} × ${formatMoney(line.actualUnitPrice)} = ${formatMoney(line.actualLineTotal)}`,
      ),
      reference: delivery.supplierDocumentReference,
      total: delivery.lines.reduce((sum, line) => sum + line.actualLineTotal, 0),
      status: deliveryStatus[delivery.status],
      employeeId: delivery.postedByEmployeeId ?? delivery.createdByEmployeeId,
    })),
  ]
    .filter((entry) => {
      const term = historyFilters.search.trim().toLocaleLowerCase('ru-RU');
      return (
        (!historyFilters.supplier || entry.supplierId === historyFilters.supplier) &&
        (!historyFilters.warehouse || entry.warehouseId === historyFilters.warehouse) &&
        (!historyFilters.resource ||
          entry.resourceIds.includes(historyFilters.resource)) &&
        (!historyFilters.employee || entry.employeeId === historyFilters.employee) &&
        (!historyFilters.type || entry.type === historyFilters.type) &&
        (!historyFilters.status || entry.status === historyFilters.status) &&
        (!historyFilters.dateFrom ||
          entry.date.slice(0, 10) >= historyFilters.dateFrom) &&
        (!historyFilters.dateTo || entry.date.slice(0, 10) <= historyFilters.dateTo) &&
        (!term ||
          `${entry.number} ${entry.reference} ${entry.supplier} ${entry.resources}`
            .toLocaleLowerCase('ru-RU')
            .includes(term))
      );
    })
    .sort((left, right) => right.date.localeCompare(left.date));

  return (
    <main className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/70 p-3 shadow-sm sm:p-5">
      <header className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Рабочее пространство
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Закупщик</h1>
            <p className="mt-1 text-sm text-slate-500">
              {state.employeeName} · складов назначения: {state.warehouses.length}
            </p>
          </div>
          {onLogoutEmployee && context.employeeId !== 'owner-preview' && (
            <button type="button" className={secondaryClass} onClick={onLogoutEmployee}>
              Сменить сотрудника
            </button>
          )}
        </div>
        <nav
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Разделы закупок"
        >
          {sections.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                section === key
                  ? `${buttonClass} shrink-0`
                  : `${secondaryClass} shrink-0`
              }
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {(error || success) && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
          role="status"
        >
          {error || success}
        </p>
      )}
      {state.warnings.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {state.warnings.map((warning) => (
            <p key={warning.warningId}>{warning.message}</p>
          ))}
        </div>
      )}

      <section className="mt-4 min-w-0 rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
        {section === 'needs' && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Потребность</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Что нужно заказать по фактическим складским остаткам.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Рекомендации создаются только при настроенном пороге
              </span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <input
                className={inputClass}
                aria-label="Поиск по названию или штрихкоду"
                placeholder="Название или штрихкод"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className={inputClass}
                aria-label="Склад"
                value={needWarehouse}
                onChange={(event) => setNeedWarehouse(event.target.value)}
              >
                <option value="">Все склады</option>
                {state.warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                aria-label="Состояние"
                value={needState}
                onChange={(event) => setNeedState(event.target.value)}
              >
                <option value="">Все состояния</option>
                {Object.entries(needStatus).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {filteredNeeds.map((need) => (
                <article
                  key={`${need.warehouseId}:${need.resource.resourceId}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{need.resource.name}</h3>
                      <p className="text-sm text-slate-500">{need.warehouseName}</p>
                    </div>
                    <strong>
                      {formatQuantity(
                        need.balance.quantityBase,
                        need.resource.baseUnit,
                      )}
                    </strong>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      Состояние: <strong>{needStatus[need.state]}</strong>
                    </p>
                    <p>
                      Рекомендация:{' '}
                      <strong>
                        {need.recommendedQuantityBase === null
                          ? 'Не настроено'
                          : formatQuantity(
                              need.recommendedQuantityBase,
                              need.resource.baseUnit,
                            )}
                      </strong>
                    </p>
                    <p>
                      Поставщик:{' '}
                      <strong>{need.preferredSupplier?.name ?? 'Не выбран'}</strong>
                    </p>
                    <p>
                      Последняя цена:{' '}
                      <strong>
                        {need.lastPrice
                          ? formatMoney(
                              need.lastPrice.actualUnitPrice,
                              need.lastPrice.currency,
                            )
                          : 'Нет данных'}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${buttonClass} mt-4 w-full sm:w-auto`}
                    onClick={() => addNeed(need)}
                  >
                    Добавить в заказ
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        {section === 'orders' && (
          <>
            <h2 className="text-xl font-semibold">Заказы поставщикам</h2>
            <form
              className="mt-4 rounded-2xl border border-slate-200 p-4"
              onSubmit={saveOrder}
            >
              <h3 className="font-semibold">
                {editingOrderId ? 'Изменить черновик' : 'Создать заказ'}
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Поставщик
                  <select
                    required
                    className={`${inputClass} mt-1`}
                    value={orderSupplierId}
                    onChange={(event) => setOrderSupplierId(event.target.value)}
                  >
                    <option value="">Выберите поставщика</option>
                    {state.suppliers
                      .filter((supplier) => supplier.status === 'active')
                      .map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Склад назначения
                  <select
                    required
                    className={`${inputClass} mt-1`}
                    value={orderWarehouseId}
                    onChange={(event) => setOrderWarehouseId(event.target.value)}
                  >
                    <option value="">Выберите склад</option>
                    {state.warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Ожидаемая дата поставки
                  <input
                    type="date"
                    className={`${inputClass} mt-1`}
                    value={orderExpectedAt}
                    onChange={(event) => setOrderExpectedAt(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Комментарий
                  <input
                    className={`${inputClass} mt-1`}
                    value={orderComment}
                    onChange={(event) => setOrderComment(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 space-y-2">
                {state.resources.map((resource) => {
                  const selected = selectedResources.includes(resource.resourceId);
                  return (
                    <div
                      key={resource.resourceId}
                      className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_130px_150px]"
                    >
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) =>
                            setSelectedResources((current) =>
                              event.target.checked
                                ? [...new Set([...current, resource.resourceId])]
                                : current.filter((id) => id !== resource.resourceId),
                            )
                          }
                        />
                        {resource.name}
                      </label>
                      {selected && (
                        <>
                          <label className="text-xs font-medium text-slate-600">
                            Количество
                            <input
                              required
                              type="number"
                              min="0.001"
                              step="0.001"
                              className={`${inputClass} mt-1`}
                              value={orderLines[resource.resourceId]?.quantity ?? '1'}
                              onChange={(event) =>
                                setOrderLines((current) => ({
                                  ...current,
                                  [resource.resourceId]: {
                                    quantity: event.target.value,
                                    price: current[resource.resourceId]?.price ?? '',
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="text-xs font-medium text-slate-600">
                            Цена закупки
                            <input
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              className={`${inputClass} mt-1`}
                              value={orderLines[resource.resourceId]?.price ?? ''}
                              onChange={(event) =>
                                setOrderLines((current) => ({
                                  ...current,
                                  [resource.resourceId]: {
                                    quantity:
                                      current[resource.resourceId]?.quantity ?? '1',
                                    price: event.target.value,
                                  },
                                }))
                              }
                            />
                          </label>
                          <p className="sm:col-span-3 text-xs text-slate-500">
                            {orderLines[resource.resourceId]?.quantity ?? '1'} ×{' '}
                            {formatQuantity(
                              resource.purchasePackageSize,
                              resource.baseUnit,
                            )}{' '}
                            ={' '}
                            {formatQuantity(
                              Number(orderLines[resource.resourceId]?.quantity ?? '1') *
                                resource.purchasePackageSize,
                              resource.baseUnit,
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={buttonClass} type="submit">
                  {editingOrderId ? 'Сохранить изменения' : 'Сохранить черновик'}
                </button>
                {(editingOrderId || selectedResources.length > 0) && (
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={resetOrderForm}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {state.orders.map((order) => (
                <article
                  key={order.orderId}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {order.supplierNameSnapshot} · {order.orderNumber}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {order.destinationWarehouseNameSnapshot}
                      </p>
                    </div>
                    <strong className="text-sm">{orderStatus[order.status]}</strong>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {order.lines.map((line) => (
                      <li key={line.lineId}>
                        {line.resourceNameSnapshot} · {line.orderedQuantityPurchaseUnit}{' '}
                        {line.purchaseUnitNameSnapshot} ·{' '}
                        {formatMoney(line.expectedLineTotal)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          className={secondaryClass}
                          onClick={() => editOrder(order)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() =>
                            void run(
                              () =>
                                service
                                  .sendOrder(context, order.orderId)
                                  .then(() => undefined),
                              'Заказ отмечен как отправленный поставщику.',
                            )
                          }
                        >
                          Отправить поставщику
                        </button>
                      </>
                    )}
                    {(order.status === 'DRAFT' || order.status === 'SENT') && (
                      <button
                        type="button"
                        className={dangerClass}
                        onClick={() => {
                          const reason = window.prompt('Причина отмены заказа');
                          if (reason)
                            void run(
                              () =>
                                service
                                  .cancelOrder(context, order.orderId, reason)
                                  .then(() => undefined),
                              'Заказ отменён.',
                            );
                        }}
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {section === 'deliveries' && (
          <>
            <h2 className="text-xl font-semibold">Поставки</h2>
            <p className="mt-1 text-sm text-slate-500">
              Приёмка по отправленным заказам с передачей физического прихода в Склад.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {state.orders
                .filter(
                  (order) =>
                    order.status === 'SENT' || order.status === 'PARTIALLY_DELIVERED',
                )
                .map((order) => (
                  <article
                    key={order.orderId}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <h3 className="font-semibold">
                      {order.supplierNameSnapshot} · {order.orderNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {order.destinationWarehouseNameSnapshot} ·{' '}
                      {orderStatus[order.status]}
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      {order.lines.map((line) => {
                        const received = receivedForLine(state, order, line.lineId);
                        return (
                          <p key={line.lineId}>
                            <strong>{line.resourceNameSnapshot}</strong>
                            <br />
                            Заказано: {line.orderedQuantityPurchaseUnit}{' '}
                            {line.purchaseUnitNameSnapshot} · Получено ранее: {received}{' '}
                            {line.purchaseUnitNameSnapshot} · Осталось:{' '}
                            {Math.max(0, line.orderedQuantityPurchaseUnit - received)}{' '}
                            {line.purchaseUnitNameSnapshot}
                          </p>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className={`${buttonClass} mt-4`}
                      onClick={() => void startDelivery(order)}
                    >
                      Принять поставку
                    </button>
                  </article>
                ))}
            </div>
            {activeDelivery && activeDeliveryOrder && (
              <form
                className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4"
                onSubmit={postDelivery}
              >
                <h3 className="font-semibold">
                  Поставка {activeDelivery.deliveryNumber} ·{' '}
                  {activeDelivery.supplierNameSnapshot}
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium">
                    Документ поставщика
                    <input
                      required
                      className={`${inputClass} mt-1`}
                      value={supplierReference}
                      onChange={(event) => setSupplierReference(event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Дата поставки
                    <input
                      required
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={deliveryDate}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-3 space-y-3">
                  {activeDeliveryOrder.lines.map((line) => (
                    <div
                      key={line.lineId}
                      className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[1fr_140px_160px]"
                    >
                      <div>
                        <strong className="text-sm">{line.resourceNameSnapshot}</strong>
                        <p className="text-xs text-slate-500">
                          Цена по заказу: {formatMoney(line.expectedUnitPrice)}
                        </p>
                      </div>
                      <label className="text-xs font-medium">
                        Получено сейчас
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          className={`${inputClass} mt-1`}
                          value={deliveryValues[line.lineId]?.quantity ?? '0'}
                          onChange={(event) =>
                            setDeliveryValues((current) => ({
                              ...current,
                              [line.lineId]: {
                                quantity: event.target.value,
                                price:
                                  current[line.lineId]?.price ??
                                  String(line.expectedUnitPrice),
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="text-xs font-medium">
                        Фактическая цена
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`${inputClass} mt-1`}
                          value={
                            deliveryValues[line.lineId]?.price ??
                            String(line.expectedUnitPrice)
                          }
                          onChange={(event) =>
                            setDeliveryValues((current) => ({
                              ...current,
                              [line.lineId]: {
                                quantity: current[line.lineId]?.quantity ?? '0',
                                price: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <label className="mt-3 block text-sm font-medium">
                  Комментарий
                  <input
                    className={`${inputClass} mt-1`}
                    value={deliveryComment}
                    onChange={(event) => setDeliveryComment(event.target.value)}
                  />
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={confirmOverdelivery}
                    onChange={(event) => setConfirmOverdelivery(event.target.checked)}
                  />
                  Подтверждаю количество сверх остатка заказа
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="submit" className={buttonClass}>
                    Провести поставку
                  </button>
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={() => setActiveDelivery(null)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {section === 'suppliers' && (
          <>
            <h2 className="text-xl font-semibold">Поставщики</h2>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <form
                className="rounded-2xl border border-slate-200 p-4"
                onSubmit={saveSupplier}
              >
                <h3 className="font-semibold">
                  {editingSupplierId ? 'Изменить поставщика' : 'Создать поставщика'}
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['name', 'Название'],
                      ['contactPerson', 'Контактное лицо'],
                      ['phone', 'Телефон'],
                      ['email', 'Email'],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className="text-sm font-medium">
                      {label}
                      <input
                        required={field === 'name'}
                        type={field === 'email' ? 'email' : 'text'}
                        className={`${inputClass} mt-1`}
                        value={supplierForm[field]}
                        onChange={(event) =>
                          setSupplierForm((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <label className="text-sm font-medium sm:col-span-2">
                    Комментарий
                    <input
                      className={`${inputClass} mt-1`}
                      value={supplierForm.comment}
                      onChange={(event) =>
                        setSupplierForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Статус
                    <select
                      className={`${inputClass} mt-1`}
                      value={supplierForm.status}
                      onChange={(event) =>
                        setSupplierForm((current) => ({
                          ...current,
                          status: event.target.value as 'active' | 'inactive',
                        }))
                      }
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </label>
                </div>
                <button type="submit" className={`${buttonClass} mt-4`}>
                  {editingSupplierId ? 'Сохранить' : 'Создать'}
                </button>
              </form>
              <form
                className="rounded-2xl border border-slate-200 p-4"
                onSubmit={saveAssortment}
              >
                <h3 className="font-semibold">
                  {editingAssortmentId
                    ? 'Изменить ассортимент'
                    : 'Ассортимент поставщика'}
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Поставщик
                    <select
                      required
                      className={`${inputClass} mt-1`}
                      value={assortmentForm.supplierId}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          supplierId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Выберите</option>
                      {state.suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Ресурс
                    <select
                      required
                      className={`${inputClass} mt-1`}
                      value={assortmentForm.resourceId}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          resourceId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Выберите</option>
                      {state.resources.map((resource) => (
                        <option key={resource.resourceId} value={resource.resourceId}>
                          {resource.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Название у поставщика
                    <input
                      className={`${inputClass} mt-1`}
                      value={assortmentForm.supplierProductName}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          supplierProductName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Артикул поставщика
                    <input
                      className={`${inputClass} mt-1`}
                      value={assortmentForm.supplierSku}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          supplierSku: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Последняя известная цена
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} mt-1`}
                      value={assortmentForm.lastKnownPrice}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          lastKnownPrice: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-7 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={assortmentForm.preferred}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          preferred: event.target.checked,
                        }))
                      }
                    />
                    Предпочтительный поставщик
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={assortmentForm.active}
                      onChange={(event) =>
                        setAssortmentForm((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                    />
                    Активен
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="submit" className={buttonClass}>
                    {editingAssortmentId
                      ? 'Сохранить изменения'
                      : 'Сохранить ассортимент'}
                  </button>
                  {editingAssortmentId && (
                    <button
                      type="button"
                      className={secondaryClass}
                      onClick={() => {
                        setEditingAssortmentId(null);
                        setAssortmentForm({
                          supplierId: '',
                          resourceId: '',
                          supplierProductName: '',
                          supplierSku: '',
                          lastKnownPrice: '',
                          preferred: false,
                          active: true,
                        });
                      }}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {state.suppliers.map((supplier) => (
                <article
                  key={supplier.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{supplier.name}</h3>
                      <p className="text-sm text-slate-500">
                        {supplier.contactPerson || 'Контакт не указан'} ·{' '}
                        {supplier.phone || 'Телефон не указан'}
                      </p>
                    </div>
                    <strong className="text-sm">
                      {supplier.status === 'active' ? 'Активен' : 'Неактивен'}
                    </strong>
                  </div>
                  <p className="mt-2 text-sm">{supplier.email || 'Email не указан'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryClass}
                      onClick={() => {
                        setEditingSupplierId(supplier.id);
                        setSupplierForm({
                          name: supplier.name,
                          contactPerson: supplier.contactPerson,
                          phone: supplier.phone,
                          email: supplier.email,
                          comment: supplier.comment ?? supplier.suppliedIngredients,
                          status:
                            supplier.status === 'inactive' ? 'inactive' : 'active',
                        });
                      }}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={dangerClass}
                      onClick={() =>
                        void run(
                          () => service.deleteSupplier(context, supplier.id),
                          'Поставщик удалён.',
                        )
                      }
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {state.assortments.map((item) => (
                <article
                  key={item.assortmentId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <div>
                    <strong>
                      {state.suppliers.find(
                        (supplier) => supplier.id === item.supplierId,
                      )?.name ?? 'Сохранённый поставщик'}
                    </strong>
                    <p>
                      {state.resources.find(
                        (resource) => resource.resourceId === item.resourceId,
                      )?.name ??
                        item.supplierProductName ??
                        'Сохранённый ресурс'}{' '}
                      · {item.purchaseUnitName} ={' '}
                      {formatQuantity(
                        item.packageSize,
                        state.resources.find(
                          (resource) => resource.resourceId === item.resourceId,
                        )?.baseUnit ?? 'pc',
                      )}{' '}
                      ·{' '}
                      {item.lastKnownPrice === null
                        ? 'Цена не указана'
                        : formatMoney(item.lastKnownPrice, item.currency)}{' '}
                      {item.preferred ? '· Предпочтительный поставщик' : ''}
                      {item.status === 'inactive' ? ' · Неактивен' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryClass}
                      onClick={() => {
                        setEditingAssortmentId(item.assortmentId);
                        setAssortmentForm({
                          supplierId: item.supplierId,
                          resourceId: item.resourceId,
                          supplierProductName: item.supplierProductName ?? '',
                          supplierSku: item.supplierSku ?? '',
                          lastKnownPrice:
                            item.lastKnownPrice === null
                              ? ''
                              : String(item.lastKnownPrice),
                          preferred: item.preferred,
                          active: item.status === 'active',
                        });
                      }}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={dangerClass}
                      onClick={() =>
                        void run(
                          () => service.removeAssortment(context, item.assortmentId),
                          'Связь ассортимента удалена.',
                        )
                      }
                    >
                      Удалить связь
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {section === 'history' && (
          <>
            <h2 className="text-xl font-semibold">История</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <input
                className={inputClass}
                placeholder="Номер, документ или ресурс"
                value={historyFilters.search}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
              />
              <select
                className={inputClass}
                value={historyFilters.supplier}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    supplier: event.target.value,
                  }))
                }
              >
                <option value="">Все поставщики</option>
                {state.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={historyFilters.warehouse}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    warehouse: event.target.value,
                  }))
                }
              >
                <option value="">Все склады</option>
                {state.warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={historyFilters.type}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                <option value="">Все документы</option>
                <option value="ORDER">Заказ поставщику</option>
                <option value="DELIVERY">Поставка</option>
              </select>
              <select
                className={inputClass}
                value={historyFilters.resource}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    resource: event.target.value,
                  }))
                }
              >
                <option value="">Все ресурсы</option>
                {state.resources.map((resource) => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={historyFilters.employee}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    employee: event.target.value,
                  }))
                }
              >
                <option value="">Все сотрудники</option>
                {state.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={historyFilters.status}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">Все статусы</option>
                {[
                  ...new Set([
                    ...Object.values(orderStatus),
                    ...Object.values(deliveryStatus),
                  ]),
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Дата с"
                className={inputClass}
                value={historyFilters.dateFrom}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }))
                }
              />
              <input
                type="date"
                aria-label="Дата по"
                className={inputClass}
                value={historyFilters.dateTo}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              {history.map((entry) => (
                <article
                  key={`${entry.type}:${entry.id}`}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <strong>
                        {entry.type === 'ORDER' ? 'Заказ поставщику' : 'Поставка'} ·{' '}
                        {entry.number}
                      </strong>
                      <p className="text-sm text-slate-500">
                        {entry.supplier} · {entry.warehouse}
                      </p>
                      {entry.reference && (
                        <p className="text-xs text-slate-500">
                          Документ поставщика: {entry.reference}
                        </p>
                      )}
                    </div>
                    <strong className="text-sm">{entry.status}</strong>
                  </div>
                  <p className="mt-2 text-sm">
                    {entry.resources || 'Без позиций'} · {formatMoney(entry.total)}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {entry.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-slate-500">
                    {state.employees.find(
                      (employee) => employee.id === entry.employeeId,
                    )?.name ?? 'Сотрудник'}{' '}
                    ·{' '}
                    {new Intl.DateTimeFormat('ru-RU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(entry.date))}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
