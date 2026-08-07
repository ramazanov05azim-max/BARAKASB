'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  KitchenRuntimeContext,
  KitchenSort,
  KitchenState,
  KitchenTicket,
  KitchenView,
} from './domain';
import { kitchenText as text } from './localization';
import { localCoffeeKitchenService, type CoffeeKitchenService } from './service';

const views: ReadonlyArray<[KitchenView, string]> = [
  ['NEW', text.new],
  ['PREPARING', text.preparing],
  ['READY', text.ready],
  ['HISTORY', text.history],
];

function elapsedMinutes(from: string, now: number): number {
  const start = Date.parse(from);
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 60_000)) : 0;
}

function ticketView(ticket: KitchenTicket): KitchenView {
  if (!ticket.orderActive || ticket.completionConfirmed) return 'HISTORY';
  if (ticket.positions.some((position) => position.status === 'NEW')) return 'NEW';
  if (ticket.positions.some((position) => position.status === 'PREPARING'))
    return 'PREPARING';
  return 'READY';
}

function duration(ticket: KitchenTicket): number | null {
  const starts = ticket.positions
    .map((position) => position.preparationStartedAt)
    .filter((value): value is string => Boolean(value))
    .map(Date.parse)
    .filter(Number.isFinite);
  const ends = ticket.positions
    .map((position) => position.readyAt)
    .filter((value): value is string => Boolean(value))
    .map(Date.parse)
    .filter(Number.isFinite);
  if (!starts.length || !ends.length) return null;
  return Math.max(0, Math.round((Math.max(...ends) - Math.min(...starts)) / 60_000));
}

function delayTone(
  ticket: KitchenTicket,
  now: number,
  timing: KitchenState['timing'],
): string {
  if (!timing || ticketView(ticket) === 'HISTORY') return 'border-slate-200';
  const minutes = elapsedMinutes(ticket.sentAt, now);
  if (minutes >= timing.criticalMinutes) return 'border-red-200 bg-red-50/35';
  if (minutes >= timing.delayedMinutes) return 'border-amber-200 bg-amber-50/40';
  return 'border-slate-200';
}

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

export function CoffeeKitchenWorkspaceScreen({
  context,
  onLogoutEmployee,
  service = localCoffeeKitchenService,
}: {
  readonly context: KitchenRuntimeContext;
  readonly onLogoutEmployee?: () => void;
  readonly service?: CoffeeKitchenService;
}) {
  const [view, setView] = useState<KitchenView>('NEW');
  const [sort, setSort] = useState<KitchenSort>('TIME');
  const [state, setState] = useState<KitchenState | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState('');
  const [clock, setClock] = useState(() => Date.now());
  const readOnly = context.employeeId === 'owner-preview';

  const reload = useCallback(async () => {
    try {
      setState(await service.load(context));
      setError('');
    } catch {
      setError(text.loadError);
    }
  }, [context, service]);

  useEffect(() => {
    const initial = window.setTimeout(() => void reload(), 0);
    const unsubscribe = service.subscribe(context, () => void reload());
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [context, reload, service]);

  const visible = useMemo(() => {
    const tickets = (state?.tickets ?? []).filter(
      (ticket) => ticketView(ticket) === view,
    );
    return [...tickets].sort((left, right) =>
      sort === 'TABLE'
        ? left.destination.localeCompare(right.destination, 'ru')
        : left.sentAt.localeCompare(right.sentAt),
    );
  }, [sort, state, view]);

  async function run(key: string, action: () => Promise<void>): Promise<void> {
    setPending(key);
    setError('');
    try {
      await action();
    } catch {
      setError(text.actionError);
    } finally {
      await reload();
      setPending('');
    }
  }

  const empty =
    view === 'NEW'
      ? text.noNewOrders
      : view === 'PREPARING'
        ? text.noPreparingOrders
        : view === 'READY'
          ? text.noReadyOrders
          : text.noHistory;

  return (
    <main className="min-w-0 overflow-x-hidden rounded-[28px] border border-slate-200 bg-slate-50/80 p-3 shadow-sm sm:p-5">
      <header className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              {text.workspace}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{text.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {text.location}: {state?.locationName ?? text.notConfigured} ·{' '}
              {text.warehouse}: {state?.sourceWarehouseName ?? text.notConfigured}
            </p>
          </div>
          {onLogoutEmployee && !readOnly ? (
            <button
              type="button"
              className={secondaryButton}
              onClick={onLogoutEmployee}
            >
              {text.logout}
            </button>
          ) : null}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav
            className="flex max-w-full gap-2 overflow-x-auto pb-1"
            aria-label={text.title}
          >
            {views.map(([key, label]) => {
              const count = state?.tickets.filter(
                (ticket) => ticketView(ticket) === key,
              ).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold ${view === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {label} {count ? `· ${count}` : ''}
                </button>
              );
            })}
          </nav>
          <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
            <span className="sr-only">{text.sorting}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as KitchenSort)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800"
            >
              <option value="TIME">{text.byTime}</option>
              <option value="TABLE">{text.byTable}</option>
            </select>
          </label>
        </div>
      </header>

      {readOnly ? (
        <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {text.ownerPreview}
        </p>
      ) : null}
      {state && !state.sourceWarehouseConfigured ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {text.warehouseMissing}
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <span>{error}</span>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => void reload()}
          >
            {text.retry}
          </button>
        </div>
      ) : null}

      {!state && !error ? (
        <div className="mt-3 rounded-[22px] border border-slate-200 bg-white p-8 text-sm text-slate-500">
          {text.loading}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-3 rounded-[22px] border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-500">
          {empty}
        </div>
      ) : (
        <section className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ticket) => {
            const hasNew = ticket.positions.some(
              (position) => position.status === 'NEW',
            );
            const allReady = ticket.positions.every(
              (position) => position.status === 'READY',
            );
            const ticketDuration = duration(ticket);
            return (
              <article
                key={ticket.orderId}
                className={`min-w-0 rounded-[22px] border bg-white p-4 shadow-sm ${delayTone(ticket, clock, state?.timing ?? null)}`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      {ticket.destination}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {ticket.orderNumber}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {elapsedMinutes(ticket.sentAt, clock)} {text.minutes}
                  </span>
                </div>
                {ticket.sentByEmployeeName ? (
                  <p className="mt-3 text-xs text-slate-500">
                    {text.employee}: {ticket.sentByEmployeeName}
                  </p>
                ) : null}
                <div className="mt-3 space-y-3">
                  {ticket.positions.map((position) => (
                    <div
                      key={position.orderItemId}
                      className="rounded-2xl bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">
                            {position.productName}{' '}
                            {position.quantity > 1 ? `×${position.quantity}` : ''}
                          </p>
                          {position.modifiers.map((modifier) => (
                            <p
                              key={`${modifier.groupName}:${modifier.optionName}`}
                              className="mt-1 text-sm text-slate-600"
                            >
                              + {modifier.optionName}
                            </p>
                          ))}
                        </div>
                        {position.status === 'READY' ? (
                          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            {text.markReady}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={readOnly || Boolean(pending)}
                            onClick={() =>
                              void run(
                                `${ticket.orderId}:${position.orderItemId}`,
                                () =>
                                  position.status === 'NEW'
                                    ? service.acceptPosition(
                                        context,
                                        ticket.orderId,
                                        position.orderItemId,
                                      )
                                    : service.markPositionReady(
                                        context,
                                        ticket.orderId,
                                        position.orderItemId,
                                      ),
                              )
                            }
                            className={`min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${position.status === 'NEW' ? 'bg-orange-100 text-orange-900 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`}
                          >
                            {position.status === 'NEW' ? text.accept : text.markReady}
                          </button>
                        )}
                      </div>
                      {position.comment ? (
                        <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-800">
                          <strong>{text.comment}:</strong> {position.comment}
                        </p>
                      ) : null}
                      {position.instructionStatus === 'AVAILABLE' ? (
                        <details className="mt-2 rounded-xl bg-white px-3 py-2 text-sm">
                          <summary className="cursor-pointer font-semibold">
                            {text.instruction}
                          </summary>
                          <p className="mt-2 leading-6 text-slate-600">
                            {position.instruction}
                          </p>
                        </details>
                      ) : position.instructionStatus === 'UNAVAILABLE' ? (
                        <p className="mt-2 text-xs font-medium text-amber-800">
                          {text.recipeUnavailable}
                        </p>
                      ) : null}
                      {position.responsibleEmployeeNames.length ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {text.responsible}:{' '}
                          {position.responsibleEmployeeNames.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                {ticketDuration !== null && ticketView(ticket) === 'HISTORY' ? (
                  <p className="mt-3 text-sm text-slate-600">
                    {text.preparationDuration}: {ticketDuration} {text.minutes}
                  </p>
                ) : null}
                {!ticket.orderActive ? (
                  <p className="mt-3 text-sm text-slate-500">{text.inactiveOrder}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={readOnly || Boolean(pending) || !hasNew}
                    onClick={() =>
                      void run(`accept:${ticket.orderId}`, () =>
                        service.acceptAll(context, ticket.orderId),
                      )
                    }
                    className="min-h-12 rounded-xl bg-orange-100 px-3 text-sm font-semibold text-orange-900 hover:bg-orange-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {text.acceptAll}
                  </button>
                  <button
                    type="button"
                    disabled={
                      readOnly ||
                      Boolean(pending) ||
                      !allReady ||
                      ticket.completionConfirmed ||
                      !ticket.orderActive
                    }
                    onClick={() =>
                      void run(`ready:${ticket.orderId}`, () =>
                        service.confirmAllReady(context, ticket.orderId),
                      )
                    }
                    className="min-h-12 rounded-xl bg-emerald-100 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {ticket.completionConfirmed ? text.completed : text.allReady}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
