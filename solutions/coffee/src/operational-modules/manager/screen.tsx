'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ManagerEvent,
  ManagerNavigationTarget,
  ManagerRuntimeContext,
  ManagerSection,
  ManagerWarning,
} from './domain';
import { managerRu as text } from './localization';
import { localCoffeeManagerWorkspaceService } from './local-service';
import type { CoffeeManagerWorkspaceService, ManagerWorkspaceState } from './service';

const sections: ReadonlyArray<ManagerSection> = [
  'overview',
  'purchasing',
  'warehouse',
  'events',
  'warnings',
];
const card = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';
const metric = 'rounded-2xl border border-slate-200 bg-slate-50/70 p-4';
const button =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50';

function formatMoney(value: number | null, currency: string): string {
  return value === null
    ? text.noData
    : new Intl.NumberFormat(text.locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
}

function formatCount(value: number | null, zeroLabel?: string): number | string {
  if (value === null) return text.unavailable;
  return value === 0 && zeroLabel ? zeroLabel : value;
}

function SourceUnavailable({ children }: { readonly children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      {children}
    </p>
  );
}

function formatQuantity(value: number, unit: 'g' | 'ml' | 'pc'): string {
  return `${new Intl.NumberFormat(text.locale, { maximumFractionDigits: 3 }).format(value)} ${text.units[unit]}`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(text.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function navigationHref(
  context: ManagerRuntimeContext,
  target: ManagerNavigationTarget | null,
): string | null {
  if (context.employeeId !== 'owner-preview' || !target?.workspaceId) return null;
  return `/projects/${encodeURIComponent(context.projectId)}/admin/solutions/coffee/workspaces/${encodeURIComponent(target.workspaceId)}/open`;
}

function OwnerNavigation({
  context,
  target,
}: {
  context: ManagerRuntimeContext;
  target: ManagerNavigationTarget | null;
}) {
  const href = navigationHref(context, target);
  return href ? (
    <a className={`${button} mt-3`} href={href}>
      {text.openWorkspace}
    </a>
  ) : (
    <p className="mt-3 text-xs leading-5 text-slate-500">{text.ownerNavigationOnly}</p>
  );
}

function WarningCard({
  context,
  warning,
}: {
  context: ManagerRuntimeContext;
  warning: ManagerWarning;
}) {
  const color =
    warning.severity === 'critical'
      ? 'border-red-200 bg-red-50/80'
      : warning.severity === 'warning'
        ? 'border-amber-200 bg-amber-50/80'
        : 'border-blue-200 bg-blue-50/80';
  return (
    <article className={`rounded-2xl border p-4 ${color}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {text.severity[warning.severity]}
      </p>
      <p className="mt-2 font-semibold text-slate-950">{warning.message}</p>
      <p className="mt-2 text-sm text-slate-700">
        {text.action}: {warning.suggestedAction}
      </p>
      <OwnerNavigation context={context} target={warning.navigationTarget} />
    </article>
  );
}

function EventCard({
  context,
  event,
}: {
  context: ManagerRuntimeContext;
  event: ManagerEvent;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-950">{event.description}</p>
        <time className="text-xs text-slate-500">{formatTime(event.timestamp)}</time>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
        {text.source}:{' '}
        {event.source === 'warehouse' ? text.sourceWarehouse : text.sourcePurchasing}
      </p>
      <OwnerNavigation context={context} target={event.navigationTarget} />
    </article>
  );
}

export function CoffeeManagerWorkspaceScreen({
  context,
  onLogoutEmployee,
  service = localCoffeeManagerWorkspaceService,
}: {
  readonly context: ManagerRuntimeContext;
  readonly onLogoutEmployee?: () => void;
  readonly service?: CoffeeManagerWorkspaceService;
}) {
  const [state, setState] = useState<ManagerWorkspaceState | null>(null);
  const [section, setSection] = useState<ManagerSection>('overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await service.load(context);
      setState(next);
      setSection(next.preferences.selectedSection);
      setError('');
    } catch {
      setError(text.loadError);
    } finally {
      setLoading(false);
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

  const warnings = useMemo(
    () =>
      [...(state?.readModel.warnings ?? [])].sort((left, right) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[left.severity] - order[right.severity];
      }),
    [state],
  );

  async function selectSection(nextSection: ManagerSection): Promise<void> {
    setSection(nextSection);
    if (!state) return;
    const preferences = await service.savePreferences(context, {
      ...state.preferences,
      selectedSection: nextSection,
    });
    setState({ ...state, preferences });
  }

  return (
    <section className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              {text.title}
            </p>
            <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={button} type="button" onClick={() => void reload()}>
              {text.refresh}
            </button>
            {onLogoutEmployee && (
              <button className={button} type="button" onClick={onLogoutEmployee}>
                {text.logout}
              </button>
            )}
          </div>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-3">
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={section === item ? 'page' : undefined}
              className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold ${
                section === item
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => void selectSection(item)}
            >
              {text.sections[item]}
            </button>
          ))}
        </div>
      </nav>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {loading && !state ? (
          <p aria-live="polite" className={card}>
            {text.loading}
          </p>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5" role="alert">
            <p>{error}</p>
            <button
              className={`${button} mt-4`}
              type="button"
              onClick={() => void reload()}
            >
              {text.refresh}
            </button>
          </div>
        ) : state ? (
          <ManagerSectionContent
            context={context}
            section={section}
            state={state}
            warnings={warnings}
          />
        ) : null}
      </div>
    </section>
  );
}

function ManagerSectionContent({
  context,
  section,
  state,
  warnings,
}: {
  context: ManagerRuntimeContext;
  section: ManagerSection;
  state: ManagerWorkspaceState;
  warnings: ReadonlyArray<ManagerWarning>;
}) {
  const model = state.readModel;
  if (section === 'overview') {
    const allOperationalSourcesAvailable =
      model.sourceAvailability.warehouse === 'available' &&
      model.sourceAvailability.purchasing === 'available';
    const kpis = [
      [
        text.revenueToday,
        formatMoney(model.salesKpis.revenueToday, model.salesKpis.currency),
      ],
      [text.receiptsToday, model.salesKpis.receiptCountToday ?? text.noData],
      [
        text.averageReceipt,
        formatMoney(model.salesKpis.averageReceiptToday, model.salesKpis.currency),
      ],
      [
        text.activeOrders,
        formatCount(model.purchasingSummary.active, text.noActiveOrders),
      ],
      [text.overdueOrders, formatCount(model.purchasingSummary.overdue)],
      [text.lowStock, formatCount(model.warehouseSummary.belowMinimum)],
      [text.outOfStock, formatCount(model.warehouseSummary.outOfStock)],
      [text.thresholdsMissing, formatCount(model.warehouseSummary.withoutThreshold)],
      [
        text.warningsCount,
        allOperationalSourcesAvailable ? warnings.length : text.unavailable,
      ],
    ] as const;
    return (
      <div className="space-y-6">
        {!allOperationalSourcesAvailable && (
          <SourceUnavailable>{text.incompleteWarnings}</SourceUnavailable>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(([label, value]) => (
            <article className={metric} key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.priorityWarnings}</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {warnings.length ? (
              warnings
                .slice(0, 6)
                .map((warning) => (
                  <WarningCard
                    key={warning.warningId}
                    context={context}
                    warning={warning}
                  />
                ))
            ) : (
              <p className="text-sm text-slate-500">{text.noWarnings}</p>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.recentEvents}</h2>
          <div className="mt-4 grid gap-3">
            {model.events.length ? (
              model.events
                .slice(0, 5)
                .map((event) => (
                  <EventCard key={event.eventId} context={context} event={event} />
                ))
            ) : (
              <p className="text-sm text-slate-500">{text.noEvents}</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (section === 'purchasing') {
    const sourceAvailable = model.sourceAvailability.purchasing === 'available';
    const statusMetrics = [
      [text.drafts, formatCount(model.purchasingSummary.drafts)],
      [text.sent, formatCount(model.purchasingSummary.sent)],
      [
        text.partiallyDelivered,
        formatCount(model.purchasingSummary.partiallyDelivered),
      ],
      [text.deliveredOrders, formatCount(model.purchasingSummary.delivered)],
      [text.cancelledOrders, formatCount(model.purchasingSummary.cancelled)],
      [text.overdueOrders, formatCount(model.purchasingSummary.overdue)],
    ] as const;
    return (
      <div className="grid gap-6">
        {!sourceAvailable && (
          <SourceUnavailable>{text.purchasingUnavailable}</SourceUnavailable>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statusMetrics.map(([label, value]) => (
            <article className={metric} key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.purchaseNeeds}</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {model.purchasing.needs.length ? (
              model.purchasing.needs.map((need) => (
                <article
                  className={metric}
                  key={`${need.warehouseId}:${need.resourceId}`}
                >
                  <p className="font-semibold">{need.resourceName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {text.warehouse}: {need.warehouseName}
                  </p>
                  <p className="mt-2 text-sm">
                    {text.recommended}:{' '}
                    {need.recommendedQuantityBase === null
                      ? text.notConfigured
                      : formatQuantity(need.recommendedQuantityBase, need.baseUnit)}
                  </p>
                  <p className="mt-1 text-sm">
                    {text.supplier}: {need.preferredSupplierName ?? text.notConfigured}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {need.hasOpenOrder ? text.openOrderExists : text.openOrderMissing}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noNeeds : text.unavailable}
              </p>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.purchaseOrders}</h2>
          <div className="mt-4 grid gap-3">
            {model.purchasing.orders.length ? (
              model.purchasing.orders.map((order) => (
                <article className={metric} key={order.orderId}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">
                      {order.orderNumber} · {order.supplierName}
                    </p>
                    <span className="text-sm text-slate-600">
                      {text.orderStatus[order.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.destinationWarehouseName} ·{' '}
                    {formatMoney(order.totalExpected, model.salesKpis.currency)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noOrders : text.unavailable}
              </p>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.deliveries}</h2>
          <div className="mt-4 grid gap-3">
            {model.purchasing.deliveries.length ? (
              model.purchasing.deliveries.map((delivery) => (
                <article className={metric} key={delivery.deliveryId}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">
                      {delivery.deliveryNumber} · {delivery.supplierName}
                    </p>
                    <span className="text-sm text-slate-600">
                      {text.deliveryStatus[delivery.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatMoney(delivery.totalActual, model.salesKpis.currency)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noDeliveries : text.unavailable}
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (section === 'warehouse') {
    const sourceAvailable = model.sourceAvailability.warehouse === 'available';
    const purchasingAvailable = model.sourceAvailability.purchasing === 'available';
    return (
      <div className="grid gap-6">
        {!sourceAvailable && (
          <SourceUnavailable>{text.warehouseUnavailable}</SourceUnavailable>
        )}
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.balances}</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {model.warehouse.balances.length ? (
              model.warehouse.balances.map((balance) => {
                const purchasingNeed = model.purchasing.needs.find(
                  (need) =>
                    need.warehouseId === balance.warehouseId &&
                    need.resourceId === balance.resourceId,
                );
                return (
                  <article
                    className={metric}
                    key={`${balance.warehouseId}:${balance.resourceId}`}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">{balance.resourceName}</p>
                      <span className="text-sm text-slate-600">
                        {text.balanceStatus[balance.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {balance.warehouseName}
                    </p>
                    <p className="mt-2 text-sm">
                      {text.quantity}:{' '}
                      {formatQuantity(balance.quantityBase, balance.baseUnit)}
                    </p>
                    <p className="mt-1 text-sm">
                      {text.minimum}:{' '}
                      {balance.minimumStockBase === null
                        ? text.notSet
                        : formatQuantity(balance.minimumStockBase, balance.baseUnit)}
                    </p>
                    {balance.status !== 'IN_STOCK' && (
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {text.recommendedPurchase}:{' '}
                        {purchasingNeed?.recommendedQuantityBase === null ||
                        purchasingNeed?.recommendedQuantityBase === undefined
                          ? purchasingAvailable
                            ? text.notConfigured
                            : text.unavailable
                          : formatQuantity(
                              purchasingNeed.recommendedQuantityBase,
                              purchasingNeed.baseUnit,
                            )}
                      </p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noBalances : text.unavailable}
              </p>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.movements}</h2>
          <div className="mt-4 grid gap-3">
            {model.warehouse.recentMovements.length ? (
              model.warehouse.recentMovements.map((movement) => (
                <article className={metric} key={movement.movementId}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">
                      {movement.resourceName} · {movement.warehouseName}
                    </p>
                    <time className="text-xs text-slate-500">
                      {formatTime(movement.occurredAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatQuantity(movement.quantityDeltaBase, movement.baseUnit)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noMovements : text.unavailable}
              </p>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="text-xl font-semibold">{text.issues}</h2>
          <div className="mt-4 grid gap-3">
            {model.warehouse.issues.filter((issue) => !issue.resolved).length ? (
              model.warehouse.issues
                .filter((issue) => !issue.resolved)
                .map((issue) => (
                  <article className={metric} key={issue.issueId}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">{issue.message}</p>
                      <time className="text-xs text-slate-500">
                        {formatTime(issue.occurredAt)}
                      </time>
                    </div>
                  </article>
                ))
            ) : (
              <p className="text-sm text-slate-500">
                {sourceAvailable ? text.noWarnings : text.unavailable}
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (section === 'events') {
    return (
      <section className={card}>
        <h2 className="text-xl font-semibold">{text.sections.events}</h2>
        <div className="mt-4 grid gap-3">
          {model.events.length ? (
            model.events.map((event) => (
              <EventCard key={event.eventId} context={context} event={event} />
            ))
          ) : (
            <p className="text-sm text-slate-500">{text.noEvents}</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={card}>
      <h2 className="text-xl font-semibold">{text.sections.warnings}</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {warnings.length ? (
          warnings.map((warning) => (
            <WarningCard key={warning.warningId} context={context} warning={warning} />
          ))
        ) : (
          <p className="text-sm text-slate-500">{text.noWarnings}</p>
        )}
      </div>
    </section>
  );
}
