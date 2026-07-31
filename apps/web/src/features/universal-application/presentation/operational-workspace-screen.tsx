'use client';

import { ArrowLeft, KeyRound, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CoffeeBarWorkspaceScreen } from '@barakasb/solution-coffee';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n/i18n-provider';
import type {
  OperationalWorkspaceSession,
  OperationalWorkspaceSessionStore,
} from '../application/workspace-access';
import { formatWorkspaceAccessCode } from '../domain/workspace-access-code';
import { localOperationalWorkspaceSession } from '../infrastructure/local-operational-workspace-session';

const selectClassName =
  'h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[15px] text-[var(--text)] outline-none transition focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-soft)]';

export function OperationalWorkspaceScreen({
  projectId,
  workspaceId,
  session = localOperationalWorkspaceSession,
}: {
  projectId: string;
  workspaceId: string;
  session?: OperationalWorkspaceSessionStore;
}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<OperationalWorkspaceSession | null>(null);

  useEffect(() => {
    const readSession = window.setTimeout(() => {
      setCurrent(session.read(projectId, workspaceId));
    }, 0);
    return () => window.clearTimeout(readSession);
  }, [projectId, session, workspaceId]);

  if (!current) {
    return (
      <section className="w-full max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">
          {t('workspace.accessDeniedTitle')}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          {t('workspace.accessDeniedDescription')}
        </p>
        <Link href="/app/connect" className={`${buttonVariants()} mt-7`}>
          {t('operational.enterCode')}
        </Link>
      </section>
    );
  }

  const selectedEmployee = current.workspace.assignedEmployees.find(
    (employee) => employee.employeeId === current.currentEmployeeId,
  );

  function selectEmployee(employeeId: string): void {
    setCurrent(
      session.selectEmployee(
        projectId,
        workspaceId,
        employeeId.length > 0 ? employeeId : null,
      ),
    );
  }

  if (
    selectedEmployee &&
    (current.workspace.workspaceType === 'bar' ||
      current.workspace.workspaceId === 'workspace-bar')
  ) {
    return (
      <CoffeeBarWorkspaceScreen
        accessCode={formatWorkspaceAccessCode(current.workspace.accessCode)}
        context={{
          projectId: current.workspace.projectId,
          businessEnvironmentId: current.workspace.businessEnvironmentId,
          workspaceId: current.workspace.workspaceId,
          employeeId: selectedEmployee.employeeId,
        }}
      />
    );
  }

  return (
    <section className="w-full max-w-4xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {t('workspace.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            {current.workspace.workspaceName}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
            {t('workspace.placeholder')}
          </p>
        </div>
        <Link
          href="/app/connect"
          onClick={() => session.clear()}
          className={buttonVariants({ variant: 'secondary' })}
        >
          <ArrowLeft className="size-4" />
          {t('workspace.changeCode')}
        </Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
                <KeyRound className="size-5" />
              </span>
              <div>
                <p className="text-xs text-[var(--muted)]">
                  {t('workspace.accessCode')}
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-[0.08em]">
                  {formatWorkspaceAccessCode(current.workspace.accessCode)}
                </p>
              </div>
            </div>
            <dl className="mt-7 grid gap-5 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
              <ReadOnlyValue
                label={t('workspace.environment')}
                value={current.workspace.environmentDisplayName}
              />
              <ReadOnlyValue
                label={t('workspace.currentEmployee')}
                value={
                  selectedEmployee?.displayName ?? t('workspace.employeeNotSelected')
                }
              />
              <ReadOnlyValue
                label={t('workspace.eyebrow')}
                value={current.workspace.workspaceName}
              />
            </dl>
            <p className="mt-6 rounded-[14px] bg-[var(--subtle)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
              {t('workspace.codeIdentityNotice')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {t('workspace.assignedEmployees')}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t('workspace.selectEmployee')}
                </p>
              </div>
              <UsersRound className="size-5 text-[var(--muted)]" />
            </div>
            {current.workspace.assignedEmployees.length === 0 ? (
              <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
                {t('workspace.noAssignedEmployees')}
              </p>
            ) : (
              <>
                <select
                  aria-label={t('workspace.selectEmployee')}
                  value={current.currentEmployeeId ?? ''}
                  onChange={(event) => selectEmployee(event.target.value)}
                  className={`${selectClassName} mt-6`}
                >
                  <option value="">{t('workspace.employeeNotSelected')}</option>
                  {current.workspace.assignedEmployees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.displayName}
                    </option>
                  ))}
                </select>
                <div className="mt-5 space-y-2">
                  {current.workspace.assignedEmployees.map((employee) => (
                    <div
                      key={employee.employeeId}
                      className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] px-3 py-3"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-[var(--action-soft)] text-[var(--action)]">
                        <UserRound className="size-4" />
                      </span>
                      <span className="text-sm font-semibold">
                        {employee.displayName}
                      </span>
                      {employee.employeeId === current.currentEmployeeId && (
                        <Badge tone="success" className="ml-auto">
                          {t('workspace.currentEmployee')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}
