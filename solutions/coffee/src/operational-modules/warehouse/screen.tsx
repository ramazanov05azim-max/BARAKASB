'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import type { WarehouseRuntimeContext, WarehouseState } from './domain';
import { localCoffeeWarehouseService, type CoffeeWarehouseService } from './service';

const sections = [
  ['balances', 'Остатки'],
  ['receipt', 'Приход'],
  ['write-off', 'Списание'],
  ['transfer', 'Перемещение'],
  ['inventory', 'Инвентаризация'],
  ['history', 'История'],
] as const;
type Section = (typeof sections)[number][0];

const inputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40';
const secondaryClass =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50';

const statusRu = {
  IN_STOCK: 'В наличии',
  LOW: 'Мало',
  OUT_OF_STOCK: 'Нет в наличии',
  NEGATIVE: 'Отрицательный остаток',
} as const;
const typeRu = {
  ingredient: 'Ингредиент',
  preparation: 'Заготовка',
  'semi-finished': 'Полуфабрикат',
  package: 'Упаковка',
} as const;
const movementRu = {
  OPENING_BALANCE: 'Начальный остаток',
  RECEIPT: 'Приход',
  WRITE_OFF: 'Списание',
  TRANSFER_OUT: 'Перемещение со склада',
  TRANSFER_IN: 'Перемещение на склад',
  INVENTORY_SURPLUS: 'Излишек',
  INVENTORY_SHORTAGE: 'Недостача',
  SALE_CONSUMPTION: 'Списание по продаже',
  REVERSAL: 'Сторно',
} as const;

function quantity(value: number, unit: 'g' | 'ml' | 'pc'): string {
  if (unit === 'g' && Math.abs(value) >= 1000)
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value / 1000)} кг`;
  if (unit === 'ml' && Math.abs(value) >= 1000)
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value / 1000)} л`;
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)} ${unit === 'pc' ? 'шт' : unit === 'ml' ? 'мл' : 'г'}`;
}

export function CoffeeWarehouseWorkspaceScreen({
  context,
  onLogoutEmployee,
  service = localCoffeeWarehouseService,
}: {
  readonly context: WarehouseRuntimeContext;
  readonly onLogoutEmployee?: () => void;
  readonly service?: CoffeeWarehouseService;
}) {
  const [section, setSection] = useState<Section>('balances');
  const [state, setState] = useState<WarehouseState | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const reload = useCallback(async () => {
    try {
      setState(await service.load(context));
      setError('');
    } catch {
      setError(
        'Не удалось загрузить склад. Проверьте назначения рабочего пространства.',
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
      setError(
        cause instanceof Error && cause.message === 'negative-confirmation-required'
          ? 'Операция создаст отрицательный остаток. Подтвердите отрицательный остаток.'
          : 'Операция не выполнена. Проверьте заполненные данные.',
      );
    }
  }

  if (!state)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        {error || 'Загрузка склада…'}
      </div>
    );
  return (
    <main className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/70 p-3 shadow-sm sm:p-5">
      <header className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Рабочее пространство
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Склад</h1>
            <p className="mt-1 text-sm text-slate-500">
              {state.employeeName} · складов: {state.warehouses.length}
            </p>
          </div>
          {onLogoutEmployee && context.employeeId !== 'owner-preview' && (
            <button type="button" className={secondaryClass} onClick={onLogoutEmployee}>
              Сменить сотрудника
            </button>
          )}
        </div>
        <nav
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Разделы склада"
        >
          {sections.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold ${section === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      {(error || success) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
        >
          {error || success}
        </div>
      )}
      <section className="mt-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:p-6">
        {state.warehouses.length === 0 ? (
          <Empty />
        ) : section === 'balances' ? (
          <Balances
            state={state}
            onOpening={(input) =>
              run(
                () => service.recordOpeningBalance(context, input),
                'Начальный остаток сохранён.',
              )
            }
          />
        ) : section === 'receipt' ? (
          <QuantityForm
            state={state}
            title="Принять на склад"
            action="Принять на склад"
            onSubmit={(input) =>
              run(() => service.recordReceipt(context, input), 'Приход сохранён.')
            }
          />
        ) : section === 'write-off' ? (
          <WriteOff
            state={state}
            onSubmit={(input) =>
              run(() => service.recordWriteOff(context, input), 'Списание сохранено.')
            }
          />
        ) : section === 'transfer' ? (
          <Transfer
            state={state}
            onSubmit={(input) =>
              run(() => service.transfer(context, input), 'Перемещение выполнено.')
            }
          />
        ) : section === 'inventory' ? (
          <Inventory state={state} service={service} context={context} run={run} />
        ) : (
          <History state={state} />
        )}
      </section>
    </main>
  );
}

function Empty() {
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl font-semibold">Нет назначенных складов</h2>
      <p className="mt-2 text-sm text-slate-500">
        Владелец должен назначить физический склад в Конструкторе решения.
      </p>
    </div>
  );
}

function Options({ state }: { state: WarehouseState }) {
  return (
    <>
      {state.resources.map((resource) => (
        <option key={resource.resourceId} value={resource.resourceId}>
          {resource.name} · {typeRu[resource.resourceType]}
        </option>
      ))}
    </>
  );
}
function WarehouseOptions({ state }: { state: WarehouseState }) {
  return (
    <>
      {state.warehouses.map((warehouse) => (
        <option key={warehouse.id} value={warehouse.id}>
          {warehouse.name}
        </option>
      ))}
    </>
  );
}

function Balances({
  state,
  onOpening,
}: {
  state: WarehouseState;
  onOpening: (input: {
    warehouseId: string;
    resourceId: string;
    quantity: number;
    unitId: string;
    comment: string;
    idempotencyKey: string;
  }) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [opening, setOpening] = useState(false);
  const filtered = state.balances.filter(
    (entry) =>
      (!warehouseId || entry.warehouseId === warehouseId) &&
      (!status || entry.status === status) &&
      entry.resource.name
        .toLocaleLowerCase('ru')
        .includes(search.toLocaleLowerCase('ru')),
  );
  const negative = state.balances.filter((entry) => entry.status === 'NEGATIVE').length;
  const out = state.balances.filter((entry) => entry.status === 'OUT_OF_STOCK').length;
  const low = state.balances.filter((entry) => entry.status === 'LOW').length;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Остатки</h2>
          <p className="mt-1 text-sm text-slate-500">
            Остаток рассчитывается только как сумма движений.
          </p>
        </div>
        <button className={buttonClass} onClick={() => setOpening((value) => !value)}>
          Ввести начальные остатки
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Summary label="Нет в наличии" value={out} />
        <Summary label="Отрицательный остаток" value={negative} danger />
        <Summary label="Мало · временный порог" value={low} />
      </div>
      {state.issues.some((issue) => !issue.resolvedAt) && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <h3 className="font-semibold">Неразрешённые складские списания</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {state.issues
              .filter((issue) => !issue.resolvedAt)
              .map((issue) => (
                <li key={issue.issueId}>{issue.message}</li>
              ))}
          </ul>
        </div>
      )}
      {opening && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <QuantityFields state={state} action="Сохранить" onSubmit={onOpening} />
        </div>
      )}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={inputClass}
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value="">Все склады</option>
          <WarehouseOptions state={state} />
        </select>
        <select
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Все состояния</option>
          {Object.entries(statusRu).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filtered.map((entry) => (
          <article
            key={`${entry.warehouseId}:${entry.resource.resourceId}:${entry.resource.resourceType}`}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-semibold">{entry.resource.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {typeRu[entry.resource.resourceType]} ·{' '}
                  {state.warehouses.find((item) => item.id === entry.warehouseId)?.name}
                </p>
              </div>
              <strong className={entry.quantityBase < 0 ? 'text-red-700' : ''}>
                {quantity(entry.quantityBase, entry.resource.baseUnit)}
              </strong>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {statusRu[entry.status]} · последнее движение:{' '}
              {entry.lastMovementAt
                ? new Date(entry.lastMovementAt).toLocaleString('ru-RU')
                : 'нет'}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
function Summary({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${danger ? 'bg-red-50 text-red-900' : 'bg-slate-50'}`}
    >
      <p className="text-sm">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function QuantityFields({
  state,
  action,
  onSubmit,
}: {
  state: WarehouseState;
  action: string;
  onSubmit: (input: {
    warehouseId: string;
    resourceId: string;
    quantity: number;
    unitId: string;
    comment: string;
    idempotencyKey: string;
  }) => Promise<void>;
}) {
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id ?? '');
  const [resourceId, setResourceId] = useState(state.resources[0]?.resourceId ?? '');
  const [amount, setAmount] = useState('');
  const [unitId, setUnitId] = useState(state.resources[0]?.baseUnitId ?? '');
  const [comment, setComment] = useState('');
  const resource = state.resources.find((item) => item.resourceId === resourceId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      warehouseId,
      resourceId,
      quantity: Number(amount),
      unitId,
      comment,
      idempotencyKey: `manual:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    });
    setAmount('');
    setComment('');
  }
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void submit(e)}>
      <label className="text-sm font-medium">
        Склад
        <select
          required
          className={`${inputClass} mt-1`}
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <WarehouseOptions state={state} />
        </select>
      </label>
      <label className="text-sm font-medium">
        Ресурс
        <select
          required
          className={`${inputClass} mt-1`}
          value={resourceId}
          onChange={(event) => {
            const nextResource = state.resources.find(
              (item) => item.resourceId === event.target.value,
            );
            setResourceId(event.target.value);
            if (nextResource) setUnitId(nextResource.baseUnitId);
          }}
        >
          <Options state={state} />
        </select>
      </label>
      <label className="text-sm font-medium">
        Количество
        <input
          required
          min="0.000001"
          step="any"
          className={`${inputClass} mt-1`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="text-sm font-medium">
        Единица
        <select
          className={`${inputClass} mt-1`}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value={resource?.baseUnitId}>
            {resource?.baseUnit === 'g'
              ? 'г'
              : resource?.baseUnit === 'ml'
                ? 'мл'
                : 'шт'}
          </option>
          {resource?.purchaseUnitId !== resource?.baseUnitId && (
            <option value={resource?.purchaseUnitId}>
              Единица закупки × {resource?.purchasePackageSize}
            </option>
          )}
        </select>
      </label>
      <label className="text-sm font-medium md:col-span-2">
        Комментарий
        <input
          className={`${inputClass} mt-1`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button className={`${buttonClass} md:col-span-2`} type="submit">
        {action}
      </button>
    </form>
  );
}
function QuantityForm({
  state,
  title,
  action,
  onSubmit,
}: {
  state: WarehouseState;
  title: string;
  action: string;
  onSubmit: Parameters<typeof QuantityFields>[0]['onSubmit'];
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Без заказа поставщику, цен, оплат и финансовых проводок.
      </p>
      <QuantityFields state={state} action={action} onSubmit={onSubmit} />
    </div>
  );
}

function WriteOff({
  state,
  onSubmit,
}: {
  state: WarehouseState;
  onSubmit: (
    input: Parameters<typeof QuantityFields>[0]['onSubmit'] extends (
      input: infer T,
    ) => unknown
      ? T & { reason: string; confirmNegative: boolean }
      : never,
  ) => Promise<void>;
}) {
  const [reason, setReason] = useState('Порча');
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <h2 className="text-xl font-semibold">Списание</h2>
      <div className="my-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Причина
          <select
            className={`${inputClass} mt-1`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {[
              'Порча',
              'Истёк срок',
              'Брак',
              'Потери',
              'Служебное использование',
              'Другое',
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />{' '}
          Подтвердить отрицательный остаток
        </label>
      </div>
      <QuantityFields
        state={state}
        action="Списать"
        onSubmit={(input) => onSubmit({ ...input, reason, confirmNegative: confirm })}
      />
    </div>
  );
}

function Transfer({
  state,
  onSubmit,
}: {
  state: WarehouseState;
  onSubmit: (input: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    resourceId: string;
    quantity: number;
    unitId: string;
    comment: string;
    idempotencyKey: string;
    confirmNegative: boolean;
  }) => Promise<void>;
}) {
  const [sourceWarehouseId, setSource] = useState(state.warehouses[0]?.id ?? '');
  const [destinationWarehouseId, setDestination] = useState(
    state.warehouses[1]?.id ?? '',
  );
  const [resourceId, setResource] = useState(state.resources[0]?.resourceId ?? '');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [confirmNegative, setConfirm] = useState(false);
  const resource = state.resources.find((item) => item.resourceId === resourceId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      sourceWarehouseId,
      destinationWarehouseId,
      resourceId,
      quantity: Number(amount),
      unitId: resource?.baseUnitId ?? '',
      comment,
      confirmNegative,
      idempotencyKey: `transfer:${Date.now()}`,
    });
    setAmount('');
  }
  return (
    <div>
      <h2 className="text-xl font-semibold">Перемещение</h2>
      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={(e) => void submit(e)}>
        <label className="text-sm font-medium">
          Со склада
          <select
            className={`${inputClass} mt-1`}
            value={sourceWarehouseId}
            onChange={(e) => setSource(e.target.value)}
          >
            <WarehouseOptions state={state} />
          </select>
        </label>
        <label className="text-sm font-medium">
          На склад
          <select
            className={`${inputClass} mt-1`}
            value={destinationWarehouseId}
            onChange={(e) => setDestination(e.target.value)}
          >
            <WarehouseOptions state={state} />
          </select>
        </label>
        <label className="text-sm font-medium">
          Ресурс
          <select
            className={`${inputClass} mt-1`}
            value={resourceId}
            onChange={(e) => setResource(e.target.value)}
          >
            <Options state={state} />
          </select>
        </label>
        <label className="text-sm font-medium">
          Количество · {resource?.baseUnit}
          <input
            required
            min="0.000001"
            step="any"
            className={`${inputClass} mt-1`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <input
          className={inputClass}
          placeholder="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmNegative}
            onChange={(e) => setConfirm(e.target.checked)}
          />{' '}
          Подтвердить отрицательный остаток
        </label>
        <button
          disabled={sourceWarehouseId === destinationWarehouseId}
          className={`${buttonClass} md:col-span-2`}
        >
          Переместить
        </button>
      </form>
    </div>
  );
}

function Inventory({
  state,
  service,
  context,
  run,
}: {
  state: WarehouseState;
  service: CoffeeWarehouseService;
  context: WarehouseRuntimeContext;
  run: (action: () => Promise<void>, message: string) => Promise<void>;
}) {
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id ?? '');
  const draft = state.inventories.find(
    (item) => item.warehouseId === warehouseId && item.status === 'DRAFT',
  );
  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Инвентаризация</h2>
          <p className="mt-1 text-sm text-slate-500">
            Укажите фактический остаток для всех активных ресурсов.
          </p>
        </div>
        {!draft && (
          <button
            className={buttonClass}
            onClick={() =>
              void run(async () => {
                await service.createInventory(context, warehouseId);
              }, 'Черновик создан.')
            }
          >
            Создать инвентаризацию
          </button>
        )}
      </div>
      <select
        className={`${inputClass} mt-5 max-w-md`}
        value={warehouseId}
        onChange={(e) => setWarehouseId(e.target.value)}
      >
        <WarehouseOptions state={state} />
      </select>
      {draft && (
        <div className="mt-5 space-y-2">
          {draft.lines.map((line) => {
            const resource = state.resources.find(
              (item) => item.resourceId === line.resourceId,
            );
            return (
              <label
                key={line.resourceId}
                className="grid items-center gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_160px]"
              >
                <span className="text-sm font-semibold">{resource?.name}</span>
                <span className="text-xs text-slate-500">
                  Учётный: {quantity(line.systemQuantityBase, line.baseUnit)}
                </span>
                <input
                  aria-label={`Фактический остаток ${resource?.name}`}
                  className={inputClass}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Фактический"
                  defaultValue={line.actualQuantityBase ?? ''}
                  onBlur={(e) =>
                    void run(async () => {
                      await service.updateInventoryLine(
                        context,
                        draft.inventoryId,
                        line.resourceId,
                        Number(e.target.value),
                        resource?.baseUnitId ?? '',
                      );
                    }, 'Фактический остаток сохранён.')
                  }
                />
              </label>
            );
          })}
          <button
            className={`${buttonClass} mt-4`}
            onClick={() =>
              void run(
                () => service.postInventory(context, draft.inventoryId),
                'Инвентаризация проведена.',
              )
            }
          >
            Провести инвентаризацию
          </button>
        </div>
      )}
    </div>
  );
}

function History({ state }: { state: WarehouseState }) {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const rows = useMemo(
    () =>
      state.movements
        .filter(
          (entry) =>
            (!warehouseId || entry.warehouseId === warehouseId) &&
            (!resourceId || entry.resourceId === resourceId) &&
            (!employeeId || entry.employeeId === employeeId) &&
            (!type || entry.movementType === type) &&
            (!dateFrom || entry.occurredAt.slice(0, 10) >= dateFrom) &&
            (!dateTo || entry.occurredAt.slice(0, 10) <= dateTo) &&
            [
              entry.sourceDocumentId,
              entry.comment,
              state.resources.find((item) => item.resourceId === entry.resourceId)
                ?.name ?? '',
            ]
              .join(' ')
              .toLocaleLowerCase('ru')
              .includes(search.toLocaleLowerCase('ru')),
        )
        .filter(
          (entry, _index, filtered) =>
            entry.movementType !== 'TRANSFER_IN' ||
            !filtered.some(
              (candidate) =>
                candidate.sourceDocumentId === entry.sourceDocumentId &&
                candidate.movementType === 'TRANSFER_OUT',
            ),
        )
        .toReversed(),
    [dateFrom, dateTo, employeeId, resourceId, search, state, type, warehouseId],
  );
  return (
    <div>
      <h2 className="text-xl font-semibold">История</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Документ, ресурс, комментарий"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={inputClass}
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value="">Все склады</option>
          <WarehouseOptions state={state} />
        </select>
        <select
          aria-label="Ресурс"
          className={inputClass}
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
        >
          <option value="">Все ресурсы</option>
          <Options state={state} />
        </select>
        <select
          aria-label="Сотрудник"
          className={inputClass}
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
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
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Все операции</option>
          {Object.entries(movementRu).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <label className="text-xs font-medium text-slate-500">
          С даты
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          По дату
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-5 space-y-2">
        {rows.map((entry) => {
          const resource = state.resources.find(
            (item) => item.resourceId === entry.resourceId,
          );
          const physical = state.warehouses.find(
            (item) => item.id === entry.warehouseId,
          );
          const pairedTransfer = state.movements.find(
            (candidate) =>
              candidate.sourceDocumentId === entry.sourceDocumentId &&
              candidate.movementId !== entry.movementId &&
              (candidate.movementType === 'TRANSFER_IN' ||
                candidate.movementType === 'TRANSFER_OUT'),
          );
          const destination = pairedTransfer
            ? state.warehouses.find((item) => item.id === pairedTransfer.warehouseId)
            : null;
          const isTransfer = Boolean(pairedTransfer);
          const employee = state.employees.find(
            (candidate) => candidate.id === entry.employeeId,
          );
          return (
            <article
              key={entry.movementId}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {isTransfer ? 'Перемещение' : movementRu[entry.movementType]} ·{' '}
                  {resource?.name}
                </strong>
                <span
                  className={
                    entry.quantityDeltaBase < 0
                      ? 'font-semibold text-red-700'
                      : 'font-semibold text-emerald-700'
                  }
                >
                  {quantity(
                    isTransfer
                      ? Math.abs(entry.quantityDeltaBase)
                      : entry.quantityDeltaBase,
                    entry.baseUnit,
                  )}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {physical?.name}
                {destination ? ` → ${destination.name}` : ''} ·{' '}
                {new Date(entry.occurredAt).toLocaleString('ru-RU')} ·{' '}
                {employee?.name ?? 'Системная операция'} · документ{' '}
                {entry.sourceDocumentId}
              </p>
              {entry.comment && <p className="mt-2 text-sm">{entry.comment}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
