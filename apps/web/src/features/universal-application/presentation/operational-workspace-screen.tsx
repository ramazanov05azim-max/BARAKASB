'use client';

import { LockKeyhole, LogOut, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CoffeeBarWorkspaceScreen } from '@barakasb/solution-coffee';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n/i18n-provider';
import type {
  OperationalWorkspaceSession,
  OperationalEmployeeAuthenticator,
  OperationalWorkspaceSessionStore,
} from '../application/workspace-access';
import { localCoffeeEmployeeAuthenticator } from '../infrastructure/local-coffee-employee-authenticator';
import { localOperationalWorkspaceSession } from '../infrastructure/local-operational-workspace-session';

const selectClassName =
  'h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[15px] text-[var(--text)] outline-none transition focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-soft)]';

export function OperationalWorkspaceScreen({
  projectId,
  workspaceId,
  session = localOperationalWorkspaceSession,
  authenticator = localCoffeeEmployeeAuthenticator,
}: {
  projectId: string;
  workspaceId: string;
  session?: OperationalWorkspaceSessionStore;
  authenticator?: OperationalEmployeeAuthenticator;
}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<OperationalWorkspaceSession | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<
    'idle' | 'submitting' | 'invalid' | 'error'
  >('idle');

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

  async function loginEmployee(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedEmployeeId || !password) return;
    setLoginState('submitting');
    try {
      const valid = await authenticator.verify({
        projectId,
        workspaceId,
        employeeId: selectedEmployeeId,
        password,
      });
      if (!valid) {
        setLoginState('invalid');
        return;
      }
      setCurrent(
        session.authenticateEmployee(projectId, workspaceId, selectedEmployeeId),
      );
      setPassword('');
      setLoginState('idle');
    } catch {
      setLoginState('error');
    }
  }

  function logoutEmployee(): void {
    setCurrent(session.logoutEmployee(projectId, workspaceId));
    setSelectedEmployeeId('');
    setPassword('');
    setLoginState('idle');
  }

  if (
    selectedEmployee &&
    (current.workspace.workspaceType === 'bar' ||
      current.workspace.workspaceId === 'workspace-bar')
  ) {
    return (
      <CoffeeBarWorkspaceScreen
        context={{
          projectId: current.workspace.projectId,
          businessEnvironmentId: current.workspace.businessEnvironmentId,
          workspaceId: current.workspace.workspaceId,
          employeeId: selectedEmployee.employeeId,
        }}
        onLogoutEmployee={logoutEmployee}
      />
    );
  }

  if (!selectedEmployee) {
    return (
      <section className="w-full max-w-2xl">
        <div className="text-center">
          <span className="soft-icon-tile mx-auto grid size-14 place-items-center rounded-[18px]">
            <UsersRound className="size-6" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {current.workspace.workspaceName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t('workspace.employeeLoginTitle')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {t('workspace.employeeLoginDescription')}
          </p>
        </div>
        <Card className="mt-7">
          <CardContent className="p-6 sm:p-8">
            {current.workspace.assignedEmployees.length === 0 ? (
              <p className="text-center text-sm leading-6 text-[var(--muted)]">
                {t('workspace.noAssignedEmployees')}
              </p>
            ) : (
              <form onSubmit={(event) => void loginEmployee(event)} noValidate>
                <fieldset>
                  <legend className="text-sm font-semibold">
                    {t('workspace.selectEmployee')}
                  </legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {current.workspace.assignedEmployees.map((employee) => {
                      const selected = selectedEmployeeId === employee.employeeId;
                      return (
                        <button
                          key={employee.employeeId}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedEmployeeId(employee.employeeId);
                            setPassword('');
                            setLoginState('idle');
                          }}
                          className={`flex min-h-14 items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition ${
                            selected
                              ? 'border-blue-200 bg-blue-50/75 text-blue-950'
                              : 'border-[var(--border)] bg-[var(--surface-raised)]'
                          }`}
                        >
                          <span className="grid size-9 place-items-center rounded-full bg-[var(--action-soft)] text-[var(--action)]">
                            <UserRound className="size-4" />
                          </span>
                          <span className="font-semibold">{employee.displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {selectedEmployeeId && (
                  <label className="mt-6 block">
                    <span className="text-sm font-semibold">
                      {t('workspace.employeePassword')}
                    </span>
                    <span className="relative mt-2 block">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setLoginState('idle');
                        }}
                        className={`${selectClassName} pl-11`}
                        aria-label={t('workspace.employeePassword')}
                      />
                    </span>
                  </label>
                )}

                {(loginState === 'invalid' || loginState === 'error') && (
                  <p
                    role="alert"
                    className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                  >
                    {t(
                      loginState === 'invalid'
                        ? 'workspace.invalidEmployeePassword'
                        : 'workspace.employeeLoginError',
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    !selectedEmployeeId ||
                    password.length === 0 ||
                    loginState === 'submitting'
                  }
                  className={`${buttonVariants()} mt-6 w-full`}
                >
                  {loginState === 'submitting'
                    ? t('workspace.employeeLoggingIn')
                    : t('workspace.employeeLogin')}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
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
        <button
          type="button"
          onClick={logoutEmployee}
          className={buttonVariants({ variant: 'secondary' })}
        >
          <LogOut className="size-4" />
          {t('workspace.changeEmployee')}
        </button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <dl className="grid gap-5 sm:grid-cols-2">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--action-soft)] text-[var(--action)]">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="text-xs text-[var(--muted)]">
                  {t('workspace.currentEmployee')}
                </p>
                <p className="mt-1 font-semibold">{selectedEmployee.displayName}</p>
              </div>
              <Badge tone="success" className="ml-auto">
                {t('workspace.employeeAuthenticated')}
              </Badge>
            </div>
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
