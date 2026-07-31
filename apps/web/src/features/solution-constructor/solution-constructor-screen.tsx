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
  ShoppingBag,
  UserCog,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  coffeeSolutionModuleIds,
  type CoffeeSolutionModuleId,
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
  type SolutionConstructorService,
  type SolutionConstructorState,
} from './solution-constructor-service';

const moduleKeys: Record<CoffeeSolutionModuleId, TranslationKey> = {
  bar: 'constructor.module.bar',
  kitchen: 'constructor.module.kitchen',
  warehouse: 'constructor.module.warehouse',
  manager: 'constructor.module.manager',
  delivery: 'constructor.module.delivery',
  production: 'constructor.module.production',
  pickup: 'constructor.module.pickup',
};

const moduleIcons = {
  bar: GlassWater,
  kitchen: ChefHat,
  warehouse: Warehouse,
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
  const [feedback, setFeedback] = useState<Feedback>(null);

  const names = useMemo<CoffeeModuleNames>(
    () => ({
      bar: t('constructor.module.bar'),
      kitchen: t('constructor.module.kitchen'),
      warehouse: t('constructor.module.warehouse'),
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
        <Link href="/app/connect" className={buttonVariants({ variant: 'secondary' })}>
          <KeyRound className="size-4" />
          {t('constructor.openUniversal')}
        </Link>
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
  service,
  onState,
  onFeedback,
}: {
  projectId: string;
  state: SolutionConstructorState;
  service: SolutionConstructorService;
  onState: (state: SolutionConstructorState) => void;
  onFeedback: (feedback: Feedback) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(2, t('constructor.validation.fullName')),
        email: z.string().trim().email(t('validation.email')),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9 ()-]{7,24}$/, t('constructor.validation.phone')),
        employeeCode: z
          .string()
          .trim()
          .min(2, t('constructor.validation.employeeCode')),
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
    defaultValues: { fullName: '', email: '', phone: '', employeeCode: '' },
  });

  async function submit(values: CreateConstructorEmployeeInput): Promise<void> {
    try {
      onState(await service.createEmployee(projectId, values));
      reset();
      onFeedback({ tone: 'success', message: t('constructor.employeeAdded') });
    } catch {
      setError('root', { message: t('constructor.operationError') });
    }
  }

  return (
    <Card className="mt-5">
      <CardContent className="p-6 sm:p-8">
        <SectionHeading
          title={t('constructor.employeesTitle')}
          description={t('constructor.employeesDescription')}
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
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
                    <p className="text-sm font-semibold">{employee.fullName}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {employee.employeeCode} · {employee.email}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form
            onSubmit={handleSubmit(submit)}
            className="grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <EmployeeField
              id="constructor-full-name"
              label={t('constructor.fullName')}
              error={errors.fullName?.message}
            >
              <Input
                id="constructor-full-name"
                placeholder={t('constructor.fullNamePlaceholder')}
                {...register('fullName')}
              />
            </EmployeeField>
            <EmployeeField
              id="constructor-employee-code"
              label={t('constructor.employeeCode')}
              error={errors.employeeCode?.message}
            >
              <Input
                id="constructor-employee-code"
                placeholder={t('constructor.employeeCodePlaceholder')}
                {...register('employeeCode')}
              />
            </EmployeeField>
            <EmployeeField
              id="constructor-email"
              label={t('constructor.email')}
              error={errors.email?.message}
            >
              <Input
                id="constructor-email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
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
            {errors.root?.message && (
              <p role="alert" className="text-sm text-[var(--danger)] sm:col-span-2">
                {errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="sm:col-span-2 sm:justify-self-end"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('constructor.savingEmployee')
                : t('constructor.addEmployee')}
            </Button>
          </form>
        </div>
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
