'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Bike,
  Check,
  ChefHat,
  Copy,
  Factory,
  GlassWater,
  KeyRound,
  Layers3,
  Pencil,
  Power,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserCog,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  coffeeSolutionModuleIds,
  type CoffeeSolutionModuleId,
  type Employee,
} from '@barakasb/solution-coffee';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/i18n-provider';
import type { TranslationKey } from '@/i18n/config';
import { formatWorkspaceAccessCode } from '@/features/universal-application/domain/workspace-access-code';
import {
  localSolutionConstructorService,
  type CoffeeModuleNames,
  type CreateConstructorEmployeeInput,
  type UpdateConstructorEmployeeInput,
  type SolutionConstructorService,
  type SolutionConstructorState,
} from './solution-constructor-service';

const moduleKeys: Record<CoffeeSolutionModuleId, TranslationKey> = {
  bar: 'constructor.module.bar',
  kitchen: 'constructor.module.kitchen',
  warehouse: 'constructor.module.warehouse',
  purchasing: 'constructor.module.purchasing',
  manager: 'constructor.module.manager',
  delivery: 'constructor.module.delivery',
  production: 'constructor.module.production',
  pickup: 'constructor.module.pickup',
};

const moduleIcons = {
  bar: GlassWater,
  kitchen: ChefHat,
  warehouse: Warehouse,
  purchasing: ShoppingCart,
  manager: UserCog,
  delivery: Bike,
  production: Factory,
  pickup: ShoppingBag,
} satisfies Record<CoffeeSolutionModuleId, typeof GlassWater>;

type Feedback = { tone: 'success' | 'error'; message: string } | null;

export function SolutionConstructorScreen({
  projectId,
  service = localSolutionConstructorService,
}: {
  projectId: string;
  service?: SolutionConstructorService;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<SolutionConstructorState | null>(null);
  const [selected, setSelected] = useState<Set<CoffeeSolutionModuleId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [rotateTarget, setRotateTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const names = useMemo<CoffeeModuleNames>(
    () => ({
      bar: t('constructor.module.bar'),
      kitchen: t('constructor.module.kitchen'),
      warehouse: t('constructor.module.warehouse'),
      purchasing: t('constructor.module.purchasing'),
      manager: t('constructor.module.manager'),
      delivery: t('constructor.module.delivery'),
      production: t('constructor.module.production'),
      pickup: t('constructor.module.pickup'),
    }),
    [t],
  );

  useEffect(() => {
    let active = true;
    void service
      .load(projectId)
      .then((value) => {
        if (!active) return;
        setState(value);
        setSelected(new Set(value.structure.selectedModuleIds));
      })
      .catch(() => {
        if (active) {
          setFeedback({ tone: 'error', message: t('constructor.loadError') });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, service, t]);

  function toggleModule(moduleId: CoffeeSolutionModuleId): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
    setFeedback(null);
  }

  async function generate(): Promise<void> {
    if (selected.size === 0) {
      setFeedback({ tone: 'error', message: t('constructor.selectAtLeastOne') });
      return;
    }
    setPendingAction('generate');
    setFeedback(null);
    try {
      const value = await service.generate(projectId, [...selected], names);
      setState(value);
      setFeedback({ tone: 'success', message: t('constructor.successGenerated') });
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function issueCode(workspaceId: string): Promise<void> {
    setPendingAction(`code:${workspaceId}`);
    setFeedback(null);
    try {
      const value = await service.issueAccessCode(projectId, workspaceId, names);
      setState(value);
      setFeedback({ tone: 'success', message: t('constructor.successCode') });
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function rotateCode(workspaceId: string): Promise<void> {
    setPendingAction(`rotate-code:${workspaceId}`);
    setFeedback(null);
    try {
      const value = await service.rotateAccessCode(projectId, workspaceId, names);
      setState(value);
      setRotateTarget(null);
      setFeedback({ tone: 'success', message: t('constructor.codeRotated') });
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function disconnectDevice(workspaceId: string): Promise<void> {
    setPendingAction(`disconnect:${workspaceId}`);
    setFeedback(null);
    try {
      setState(await service.disconnectDevice(projectId, workspaceId));
      setFeedback({
        tone: 'success',
        message: t('constructor.deviceDisconnected'),
      });
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function assignEmployee(
    workspaceId: string,
    employeeId: string,
    assigned: boolean,
  ): Promise<void> {
    setPendingAction(`assignment:${workspaceId}:${employeeId}`);
    setFeedback(null);
    try {
      setState(
        await service.assignEmployee(
          projectId,
          workspaceId,
          employeeId,
          assigned,
          names,
        ),
      );
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function assignWarehouse(
    workspaceId: string,
    warehouseId: string,
    assigned: boolean,
  ): Promise<void> {
    setPendingAction(`warehouse:${workspaceId}:${warehouseId}`);
    try {
      setState(
        await service.assignWarehouse(projectId, workspaceId, warehouseId, assigned),
      );
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function assignSourceWarehouse(
    workspaceId: string,
    warehouseId: string | null,
  ): Promise<void> {
    setPendingAction(`source:${workspaceId}`);
    try {
      setState(
        await service.assignSourceWarehouse(projectId, workspaceId, warehouseId),
      );
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function assignLocation(
    workspaceId: string,
    locationId: string | null,
  ): Promise<void> {
    setPendingAction(`location:${workspaceId}`);
    try {
      setState(await service.assignLocation(projectId, workspaceId, locationId));
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function setPreparationTiming(
    workspaceId: string,
    timing: { delayedMinutes: number; criticalMinutes: number },
  ): Promise<void> {
    setPendingAction(`timing:${workspaceId}`);
    try {
      setState(await service.setPreparationTiming(projectId, workspaceId, timing));
      setFeedback({
        tone: 'success',
        message: t('constructor.kitchenTimingSaved'),
      });
    } catch {
      setFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingAction(null);
    }
  }

  async function copyCode(code: string): Promise<void> {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
  }

  if (loading) {
    return (
      <div className="space-y-5" aria-label={t('common.loading')}>
        <div className="skeleton h-36 max-w-3xl rounded-[24px]" />
        <div className="skeleton h-80 rounded-[24px]" />
      </div>
    );
  }

  if (!state) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <h1 className="text-2xl font-semibold">{t('constructor.loadError')}</h1>
          <Link
            href={`/projects/${projectId}/admin/solutions/coffee/setup`}
            className={`${buttonVariants()} mt-7`}
          >
            {t('dashboard.configureCoffee')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const accessByWorkspace = new Map(
    state.accessCodes.map((access) => [access.workspaceId, access]),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        {t('constructor.backProject')}
      </Link>

      <div className="mt-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span className="soft-icon-tile grid size-14 place-items-center rounded-[18px]">
            <Layers3 className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {t('constructor.eyebrow')}
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {t('constructor.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[var(--text-secondary)]">
            {t('constructor.description')}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`mt-6 rounded-[16px] border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="p-6 sm:p-8">
          <SectionHeading
            title={t('constructor.modulesTitle')}
            description={t('constructor.modulesDescription')}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {coffeeSolutionModuleIds.map((moduleId) => {
              const Icon = moduleIcons[moduleId];
              const active = selected.has(moduleId);
              return (
                <button
                  key={moduleId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleModule(moduleId)}
                  className={`relative min-h-32 rounded-[20px] border p-5 text-left transition ${
                    active
                      ? 'border-blue-300 bg-[var(--action-soft)] shadow-[0_12px_32px_rgb(23_105_255_/_10%)]'
                      : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-[13px] ${
                      active
                        ? 'bg-[var(--action)] text-white'
                        : 'bg-[var(--subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="mt-5 block font-semibold">
                    {t(moduleKeys[moduleId])}
                  </span>
                  <span
                    className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border ${
                      active
                        ? 'border-[var(--action)] bg-[var(--action)] text-white'
                        : 'border-[var(--border-strong)]'
                    }`}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {t('constructor.selected')}: {selected.size}
              </p>
              {state.structure.generatedAt && (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t('constructor.regenerateWarning')}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={() => void generate()}
              disabled={pendingAction !== null}
            >
              {pendingAction === 'generate'
                ? t('constructor.generating')
                : t('constructor.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6 sm:p-8">
          <SectionHeading
            title={t('constructor.workspacesTitle')}
            description={t('constructor.workspacesDescription')}
          />
          {state.structure.workspaces.length === 0 ? (
            <EmptyState message={t('constructor.noWorkspaces')} />
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {state.structure.workspaces.map((workspace) => {
                const access = accessByWorkspace.get(workspace.id);
                const WorkspaceIcon = moduleIcons[workspace.moduleId];
                return (
                  <article
                    key={workspace.id}
                    className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge tone="success">{t('constructor.workspaceReady')}</Badge>
                        <h3 className="mt-3 text-xl font-semibold">
                          {t(moduleKeys[workspace.moduleId])}
                        </h3>
                      </div>
                      <span className="soft-icon-tile grid size-11 place-items-center rounded-[14px]">
                        <WorkspaceIcon className="size-5" />
                      </span>
                    </div>

                    <div className="mt-5 rounded-[16px] bg-[var(--subtle)] p-4">
                      {access ? (
                        <>
                          {state.connectedWorkspaceId === workspace.id && (
                            <Badge tone="success" className="mb-3">
                              {t('constructor.deviceConnected')}
                            </Badge>
                          )}
                          <p className="font-mono text-lg font-semibold tracking-[0.08em]">
                            {formatWorkspaceAccessCode(access.accessCode)}
                          </p>
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            className="mt-2"
                            onClick={() => void copyCode(access.accessCode)}
                          >
                            {copiedCode === access.accessCode ? (
                              <Check className="size-4" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                            {t(
                              copiedCode === access.accessCode
                                ? 'constructor.codeCopied'
                                : 'constructor.copyCode',
                            )}
                          </Button>
                          {state.connectedWorkspaceId === workspace.id && (
                            <Button
                              type="button"
                              variant="quiet"
                              size="sm"
                              className="mt-2 text-[var(--danger)]"
                              onClick={() => void disconnectDevice(workspace.id)}
                              disabled={pendingAction !== null}
                            >
                              <Power className="size-4" />
                              {t('constructor.disconnectDevice')}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            className="mt-2"
                            onClick={() => setRotateTarget(workspace.id)}
                            disabled={pendingAction !== null}
                          >
                            <RefreshCw className="size-4" />
                            {pendingAction === `rotate-code:${workspace.id}`
                              ? t('constructor.codeGenerating')
                              : t('constructor.rotateCode')}
                          </Button>
                          {rotateTarget === workspace.id && (
                            <div className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                              <p>{t('constructor.rotateCodeConfirm')}</p>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setRotateTarget(null)}
                                >
                                  {t('common.cancel')}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void rotateCode(workspace.id)}
                                  disabled={pendingAction !== null}
                                >
                                  {t('constructor.rotateCode')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-[var(--muted)]">
                            {t('constructor.codeNotGenerated')}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void issueCode(workspace.id)}
                            disabled={pendingAction !== null}
                          >
                            <KeyRound className="size-4" />
                            {pendingAction === `code:${workspace.id}`
                              ? t('constructor.codeGenerating')
                              : t('constructor.generateCode')}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                        {t('constructor.assignedEmployees')}
                      </p>
                      {state.employees.length === 0 ? (
                        <p className="mt-3 text-sm text-[var(--muted)]">
                          {t('constructor.noAssignments')}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {state.employees.map((employee) => {
                            const checked = workspace.assignedEmployeeIds.includes(
                              employee.id,
                            );
                            return (
                              <label
                                key={employee.id}
                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] border border-[var(--border)] px-3 py-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={pendingAction !== null}
                                  onChange={(event) =>
                                    void assignEmployee(
                                      workspace.id,
                                      employee.id,
                                      event.target.checked,
                                    )
                                  }
                                  className="size-4 accent-[var(--action)]"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">
                                    {employee.fullName}
                                  </span>
                                  <span className="block text-xs text-[var(--muted)]">
                                    {employee.employeeCode}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {(workspace.moduleId === 'warehouse' ||
                      workspace.moduleId === 'purchasing') && (
                      <div className="mt-5 border-t border-[var(--border)] pt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                          {workspace.moduleId === 'purchasing'
                            ? t('constructor.purchasingWarehouses')
                            : 'Физические склады рабочего пространства'}
                        </p>
                        <div className="mt-3 space-y-2">
                          {state.warehouses.map((warehouse) => (
                            <label
                              key={warehouse.id}
                              className="flex min-h-11 items-center gap-3 rounded-[14px] border border-[var(--border)] px-3 py-2 text-sm font-semibold"
                            >
                              <input
                                type="checkbox"
                                checked={(
                                  workspace.assignedWarehouseIds ?? []
                                ).includes(warehouse.id)}
                                disabled={pendingAction !== null}
                                onChange={(event) =>
                                  void assignWarehouse(
                                    workspace.id,
                                    warehouse.id,
                                    event.target.checked,
                                  )
                                }
                              />
                              {warehouse.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {workspace.moduleId === 'kitchen' && (
                      <div className="mt-5 space-y-4 border-t border-[var(--border)] pt-5">
                        <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                          {t('constructor.kitchenLocation')}
                          <select
                            className="mt-2 min-h-11 w-full rounded-[14px] border border-[var(--border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--text)]"
                            value={workspace.locationId ?? ''}
                            disabled={pendingAction !== null}
                            onChange={(event) =>
                              void assignLocation(
                                workspace.id,
                                event.target.value || null,
                              )
                            }
                          >
                            <option value="">
                              {t('constructor.locationNotAssigned')}
                            </option>
                            {state.locations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <form
                          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const values = new FormData(event.currentTarget);
                            void setPreparationTiming(workspace.id, {
                              delayedMinutes: Number(values.get('delayedMinutes')),
                              criticalMinutes: Number(values.get('criticalMinutes')),
                            });
                          }}
                        >
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                            {t('constructor.kitchenDelayMinutes')}
                            <input
                              name="delayedMinutes"
                              type="number"
                              min="1"
                              required
                              defaultValue={
                                workspace.preparationTiming?.delayedMinutes ?? ''
                              }
                              className="mt-2 min-h-11 w-full rounded-[14px] border border-[var(--border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--text)]"
                            />
                          </label>
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                            {t('constructor.kitchenCriticalMinutes')}
                            <input
                              name="criticalMinutes"
                              type="number"
                              min="2"
                              required
                              defaultValue={
                                workspace.preparationTiming?.criticalMinutes ?? ''
                              }
                              className="mt-2 min-h-11 w-full rounded-[14px] border border-[var(--border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--text)]"
                            />
                          </label>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={pendingAction !== null}
                          >
                            {t('constructor.saveKitchenTiming')}
                          </Button>
                        </form>
                      </div>
                    )}
                    {(workspace.moduleId === 'bar' ||
                      workspace.moduleId === 'kitchen' ||
                      workspace.moduleId === 'warehouse') && (
                      <div className="mt-5 border-t border-[var(--border)] pt-5">
                        <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                          {t('constructor.sourceWarehouse')}
                          <select
                            className="mt-2 min-h-11 w-full rounded-[14px] border border-[var(--border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--text)]"
                            value={workspace.sourceWarehouseId ?? ''}
                            disabled={pendingAction !== null}
                            onChange={(event) =>
                              void assignSourceWarehouse(
                                workspace.id,
                                event.target.value || null,
                              )
                            }
                          >
                            <option value="">
                              {t('constructor.warehouseNotAssigned')}
                            </option>
                            {state.warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
                      <Link
                        href={`/projects/${projectId}/admin/solutions/coffee/workspaces/${workspace.id}/open`}
                        className={buttonVariants({ size: 'sm' })}
                      >
                        {t('ownerOverview.open')}
                      </Link>
                      <Link
                        href={`/projects/${projectId}/admin/solutions/coffee/constructor`}
                        className={buttonVariants({
                          variant: 'secondary',
                          size: 'sm',
                        })}
                      >
                        {t('ownerOverview.configure')}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeSection
        projectId={projectId}
        state={state}
        names={names}
        service={service}
        onState={setState}
        onFeedback={setFeedback}
      />

      <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-[var(--muted)]">
        {t('constructor.permissionNotice')}
      </p>
    </div>
  );
}

function EmployeeSection({
  projectId,
  state,
  names,
  service,
  onState,
  onFeedback,
}: {
  projectId: string;
  state: SolutionConstructorState;
  names: CoffeeModuleNames;
  service: SolutionConstructorService;
  onState: (state: SolutionConstructorState) => void;
  onFeedback: (feedback: Feedback) => void;
}) {
  const { t } = useTranslation();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Employee | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [pendingEmployeeAction, setPendingEmployeeAction] = useState<string | null>(
    null,
  );
  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t('constructor.validation.firstName')),
        lastName: z.string().trim().min(1, t('constructor.validation.lastName')),
        position: z.string().trim(),
        phone: z
          .string()
          .trim()
          .refine(
            (value) => !value || /^\+?[0-9 ()-]{7,24}$/.test(value),
            t('constructor.validation.phone'),
          ),
        notes: z.string().trim(),
        password: z.string(),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateConstructorEmployeeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      phone: '',
      notes: '',
      password: '',
    },
  });

  async function submit(values: CreateConstructorEmployeeInput): Promise<void> {
    try {
      if (editingEmployee) {
        const update: UpdateConstructorEmployeeInput = {
          firstName: values.firstName,
          lastName: values.lastName,
          position: values.position,
          phone: values.phone,
          notes: values.notes,
        };
        onState(
          await service.updateEmployee(projectId, editingEmployee.id, update, names),
        );
      } else {
        if (values.password.length < 4) {
          setError('password', {
            message: t('constructor.validation.password'),
          });
          return;
        }
        onState(await service.createEmployee(projectId, values, names));
      }
      reset();
      setEditingEmployee(null);
      onFeedback({
        tone: 'success',
        message: t(
          editingEmployee ? 'constructor.employeeUpdated' : 'constructor.employeeAdded',
        ),
      });
    } catch {
      setError('root', { message: t('constructor.operationError') });
    }
  }

  function startEdit(employee: Employee): void {
    setEditingEmployee(employee);
    reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      phone: employee.phone,
      notes: employee.notes,
      password: '',
    });
  }

  function cancelEdit(): void {
    setEditingEmployee(null);
    reset({
      firstName: '',
      lastName: '',
      position: '',
      phone: '',
      notes: '',
      password: '',
    });
  }

  async function setActive(employee: Employee): Promise<void> {
    setPendingEmployeeAction(`status:${employee.id}`);
    try {
      onState(
        await service.setEmployeeActive(
          projectId,
          employee.id,
          employee.employmentStatus !== 'active',
          names,
        ),
      );
    } finally {
      setPendingEmployeeAction(null);
    }
  }

  async function removeEmployee(employee: Employee): Promise<void> {
    setPendingEmployeeAction(`delete:${employee.id}`);
    try {
      onState(await service.deleteEmployee(projectId, employee.id, names));
      setDeleteTarget(null);
      if (editingEmployee?.id === employee.id) cancelEdit();
      onFeedback({
        tone: 'success',
        message: t('constructor.employeeDeleted'),
      });
    } catch {
      onFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingEmployeeAction(null);
    }
  }

  async function submitPasswordReset(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!passwordTarget || resetPassword.length < 4) return;
    setPendingEmployeeAction(`password:${passwordTarget.id}`);
    try {
      onState(
        await service.resetEmployeePassword(projectId, {
          employeeId: passwordTarget.id,
          password: resetPassword,
        }),
      );
      setPasswordTarget(null);
      setResetPassword('');
      onFeedback({
        tone: 'success',
        message: t('constructor.passwordResetSuccess'),
      });
    } catch {
      onFeedback({ tone: 'error', message: t('constructor.operationError') });
    } finally {
      setPendingEmployeeAction(null);
    }
  }

  return (
    <Card id="employees" className="mt-5 scroll-mt-28">
      <CardContent className="p-6 sm:p-8">
        <SectionHeading
          title={t('constructor.employeesTitle')}
          description={t('constructor.employeesDescription')}
        />
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--subtle)] p-4">
            {state.employees.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                {t('constructor.noEmployees')}
              </p>
            ) : (
              <div className="space-y-2">
                {state.employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-[14px] bg-[var(--surface-raised)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{employee.fullName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {employee.position || t('constructor.positionNotSet')} ·{' '}
                          {employee.employeeCode}
                        </p>
                      </div>
                      <Badge
                        tone={
                          employee.employmentStatus === 'active' ? 'success' : 'warning'
                        }
                      >
                        {t(
                          employee.employmentStatus === 'active'
                            ? 'common.active'
                            : 'common.inactive',
                        )}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--border)] pt-3">
                      <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={() => startEdit(employee)}
                      >
                        <Pencil className="size-3.5" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={() => void setActive(employee)}
                        disabled={pendingEmployeeAction !== null}
                      >
                        <Power className="size-3.5" />
                        {t(
                          employee.employmentStatus === 'active'
                            ? 'common.deactivate'
                            : 'common.activate',
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={() => {
                          setPasswordTarget(employee);
                          setResetPassword('');
                        }}
                      >
                        <KeyRound className="size-3.5" />
                        {t('constructor.resetPassword')}
                      </Button>
                      <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={() => setDeleteTarget(employee)}
                      >
                        <Trash2 className="size-3.5" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form
            onSubmit={handleSubmit(submit)}
            className="grid self-start gap-4 sm:grid-cols-2"
            noValidate
          >
            <EmployeeField
              id="constructor-first-name"
              label={t('constructor.firstName')}
              error={errors.firstName?.message}
            >
              <Input
                id="constructor-first-name"
                placeholder={t('constructor.firstNamePlaceholder')}
                {...register('firstName')}
              />
            </EmployeeField>
            <EmployeeField
              id="constructor-last-name"
              label={t('constructor.lastName')}
              error={errors.lastName?.message}
            >
              <Input
                id="constructor-last-name"
                placeholder={t('constructor.lastNamePlaceholder')}
                {...register('lastName')}
              />
            </EmployeeField>
            <EmployeeField
              id="constructor-position"
              label={t('constructor.position')}
              error={errors.position?.message}
            >
              <Input id="constructor-position" {...register('position')} />
            </EmployeeField>
            <EmployeeField
              id="constructor-phone"
              label={t('constructor.phone')}
              error={errors.phone?.message}
            >
              <Input
                id="constructor-phone"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
              />
            </EmployeeField>
            <EmployeeField
              id="constructor-notes"
              label={t('constructor.notes')}
              error={errors.notes?.message}
            >
              <Input id="constructor-notes" {...register('notes')} />
            </EmployeeField>
            {!editingEmployee && (
              <EmployeeField
                id="constructor-password"
                label={t('constructor.password')}
                error={errors.password?.message}
              >
                <Input
                  id="constructor-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
              </EmployeeField>
            )}
            {errors.root?.message && (
              <p role="alert" className="text-sm text-[var(--danger)] sm:col-span-2">
                {errors.root.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              {editingEmployee && (
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('constructor.savingEmployee')
                  : t(
                      editingEmployee
                        ? 'constructor.saveEmployee'
                        : 'constructor.addEmployee',
                    )}
              </Button>
            </div>
          </form>
        </div>

        {deleteTarget && (
          <div className="mt-6 rounded-[18px] border border-red-200 bg-red-50 p-5">
            <p className="font-semibold">{t('constructor.deleteEmployeeTitle')}</p>
            <p className="mt-2 text-sm text-red-900">
              {t('constructor.deleteEmployeeDescription')} {deleteTarget.fullName}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => void removeEmployee(deleteTarget)}
                disabled={pendingEmployeeAction !== null}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        )}

        {passwordTarget && (
          <form
            onSubmit={(event) => void submitPasswordReset(event)}
            className="mt-6 rounded-[18px] border border-[var(--border)] bg-[var(--subtle)] p-5"
          >
            <p className="font-semibold">{t('constructor.resetPassword')}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {passwordTarget.fullName}
            </p>
            <Label htmlFor="constructor-reset-password" className="mt-4 block">
              {t('constructor.newPassword')}
            </Label>
            <Input
              id="constructor-reset-password"
              type="password"
              autoComplete="new-password"
              className="mt-2"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
            {resetPassword.length > 0 && resetPassword.length < 4 && (
              <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
                {t('constructor.validation.password')}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasswordTarget(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={resetPassword.length < 4 || pendingEmployeeAction !== null}
              >
                {t('constructor.resetPassword')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-[20px] border border-dashed border-[var(--border-strong)] px-5 py-12 text-center text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}

function EmployeeField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
