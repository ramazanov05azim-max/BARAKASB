'use client';

import { AlertTriangle, Check, Coffee, Copy, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatBusinessEnvironmentCode } from './business-environment-code';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  coffeeCrashTestDisplayName,
  coffeeCrashTestProjectId,
} from './coffee-manager-setup-repository';
import {
  localCoffeeCrashTestService,
  type CoffeeCrashTestService,
  type CoffeeCrashTestState,
} from './coffee-crash-test-service';

export function CoffeeCrashTestScreen({
  service = localCoffeeCrashTestService,
}: {
  service?: CoffeeCrashTestService;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<CoffeeCrashTestState | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(false);
  const projectUrl = `/projects/${coffeeCrashTestProjectId}`;
  const setupUrl = `${projectUrl}/admin/solutions/coffee/setup`;

  useEffect(() => {
    let active = true;
    void service
      .inspect()
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [service]);

  async function resetAndInstall(): Promise<void> {
    if (!window.confirm(t('crashTest.destructiveWarning'))) return;
    setWorking(true);
    setError(false);
    try {
      await service.resetAndInstall();
      router.push(`${projectUrl}?crashTestInstalled=1`);
      router.refresh();
    } catch {
      setError(true);
      setWorking(false);
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm(t('crashTest.deleteWarning'))) return;
    setWorking(true);
    setError(false);
    try {
      setState(await service.delete());
    } catch {
      setError(true);
    } finally {
      setWorking(false);
    }
  }

  const code = state?.record?.businessEnvironmentCode;

  return (
    <div className="mx-auto max-w-4xl">
      <Badge tone="warning">{t('crashTest.devOnly')}</Badge>
      <div className="mt-5 flex items-start gap-4">
        <span className="soft-icon-tile grid size-14 shrink-0 place-items-center rounded-[18px]">
          <Coffee className="size-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {t('crashTest.eyebrow')}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {coffeeCrashTestDisplayName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {t('crashTest.description')}
          </p>
        </div>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6 sm:p-8">
          {!state ? (
            <div className="skeleton h-48 rounded-[18px]" />
          ) : state.status === 'installed' && code ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="success">{t('crashTest.installed')}</Badge>
                <Badge>{t('crashTest.marker')}</Badge>
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t('coffeeOnboarding.businessEnvironmentCodeLabel')}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.08em]">
                {formatBusinessEnvironmentCode(code)}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => void navigator.clipboard.writeText(code)}
              >
                <Copy className="size-4" />
                {t('coffeeOnboarding.copyCode')}
              </Button>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link href={projectUrl} className={buttonVariants()}>
                  {t('crashTest.openManager')}
                </Link>
                <Link
                  href={setupUrl}
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  {t('crashTest.openSetup')}
                </Link>
                <Link href="/app" className={buttonVariants({ variant: 'secondary' })}>
                  {t('crashTest.openOperational')}
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={working}
                  onClick={() => void resetAndInstall()}
                >
                  <RefreshCw className="size-4" />
                  {t('crashTest.updateEnvironment')}
                </Button>
              </div>
              <Button
                type="button"
                variant="quiet"
                className="mt-5 text-[var(--danger)]"
                disabled={working}
                onClick={() => void remove()}
              >
                <Trash2 className="size-4" />
                {t('crashTest.delete')}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h2 className="font-semibold">
                    {t(
                      state.status === 'reset-required'
                        ? 'crashTest.resetRequired'
                        : 'crashTest.notInstalled',
                    )}
                  </h2>
                  <p className="mt-1 text-sm leading-6">
                    {t('crashTest.resetExplanation')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                className="mt-6"
                disabled={working}
                onClick={() => void resetAndInstall()}
              >
                {working ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t('crashTest.updateEnvironment')}
              </Button>
            </>
          )}

          {state && (
            <dl className="mt-8 grid gap-3 rounded-[18px] bg-[var(--subtle)] p-4 text-sm sm:grid-cols-3">
              <Diagnostic
                label={t('crashTest.projects')}
                value={state.diagnostics.projectCount}
              />
              <Diagnostic
                label={t('crashTest.installations')}
                value={state.diagnostics.installationCount}
              />
              <Diagnostic
                label={t('crashTest.environments')}
                value={state.diagnostics.environmentCount}
              />
            </dl>
          )}
          {error && (
            <p role="alert" className="mt-5 text-sm text-[var(--danger)]">
              {t('crashTest.error')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Diagnostic({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
