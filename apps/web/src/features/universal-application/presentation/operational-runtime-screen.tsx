'use client';

import {
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  LogOut,
  PackagePlus,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n/i18n-provider';
import type {
  OperationalRuntimeSessionStore,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';
import { localOperationalRuntimeSession } from '../infrastructure/local-operational-runtime-session';

const modules = [
  ['goodsReceipt', PackagePlus],
  ['purchasing', ReceiptText],
  ['stockBalances', Boxes],
  ['inventoryAdjustments', ClipboardList],
  ['production', Factory],
  ['productSales', ReceiptText],
  ['operationalReporting', BarChart3],
] as const;

export function OperationalRuntimeScreen({
  projectId,
  session = localOperationalRuntimeSession,
}: {
  projectId: string;
  session?: OperationalRuntimeSessionStore;
}) {
  const { t } = useTranslation();
  const environment: ResolvedBusinessEnvironment | null = session.read(projectId);

  if (!environment) {
    return (
      <section className="w-full max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">
          {t('operational.accessDeniedTitle')}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          {t('operational.accessDeniedDescription')}
        </p>
        <Link href="/app/connect" className={`${buttonVariants()} mt-7`}>
          {t('operational.enterCode')}
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-5xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {t('operational.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {environment.displayName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {t('operational.readinessDescription')}
          </p>
        </div>
        <Link
          href="/app/connect"
          onClick={() => session.clear()}
          className={buttonVariants({ variant: 'secondary' })}
        >
          <LogOut className="size-4" />
          {t('operational.changeEnvironment')}
        </Link>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-xl font-semibold">
                {t('operational.readinessTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {t('operational.prototypeNotice')}
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {t('operational.notReady')}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(([key, Icon]) => (
              <div
                key={key}
                className="rounded-[18px] border border-[var(--border)] bg-[var(--subtle)] p-4 opacity-75"
              >
                <Icon className="size-5 text-[var(--muted)]" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold">
                  {t(`operational.modules.${key}`)}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {t('operational.unavailable')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
