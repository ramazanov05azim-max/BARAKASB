'use client';

import {
  localCoffeeOperationalReadRepository,
  type CoffeeOperationalReadRepository,
  type CoffeeOperationalSnapshot,
} from '@barakasb/solution-coffee';
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
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
  repository = localCoffeeOperationalReadRepository,
}: {
  projectId: string;
  session?: OperationalRuntimeSessionStore;
  repository?: CoffeeOperationalReadRepository;
}) {
  const { t } = useTranslation();
  const environment: ResolvedBusinessEnvironment | null = session.read(projectId);
  const canLoadCoffeeConfiguration = environment?.solutionId === 'coffee';
  const [snapshot, setSnapshot] = useState<
    CoffeeOperationalSnapshot | null | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    if (!canLoadCoffeeConfiguration) {
      return () => {
        active = false;
      };
    }
    void repository
      .load(projectId)
      .then((value) => {
        if (active) setSnapshot(value);
      })
      .catch(() => {
        if (active) setSnapshot(null);
      });
    return () => {
      active = false;
    };
  }, [canLoadCoffeeConfiguration, projectId, repository]);

  const inventorySummary = useMemo(() => {
    if (!snapshot) return null;
    const ingredientsById = new Map(
      snapshot.ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );
    const totalValue = snapshot.openingStockBalances.reduce(
      (sum, balance) =>
        sum + balance.quantity * (ingredientsById.get(balance.ingredientId)?.cost ?? 0),
      0,
    );
    const zero = snapshot.openingStockBalances.filter(
      (balance) => balance.quantity === 0,
    ).length;
    const low = snapshot.openingStockBalances.filter((balance) => {
      const ingredient = ingredientsById.get(balance.ingredientId);
      return (
        balance.quantity > 0 &&
        ingredient !== undefined &&
        balance.quantity <= ingredient.minimumStock
      );
    }).length;
    return { totalValue, zero, low };
  }, [snapshot]);

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
          {environment.developmentDemo && (
            <Badge tone="warning" className="mt-3">
              {t('crashTest.marker')}
            </Badge>
          )}
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

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">
              {t('operational.environmentIdentity')}
            </h2>
            {snapshot === undefined ? (
              <div className="skeleton mt-5 h-36 rounded-[16px]" />
            ) : snapshot ? (
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <ReadOnlyValue
                  label={t('operational.project')}
                  value={snapshot.project.name}
                />
                <ReadOnlyValue
                  label={t('operational.establishment')}
                  value={snapshot.businessProfile.businessName}
                />
                <ReadOnlyValue
                  label={t('operational.owner')}
                  value={snapshot.businessProfile.ownerName ?? '—'}
                />
                <ReadOnlyValue
                  label={t('operational.defaultLocation')}
                  value={
                    snapshot.locations.find(
                      (location) => location.id === snapshot.project.defaultLocationId,
                    )?.name ?? '—'
                  }
                />
                <ReadOnlyValue
                  label={t('operational.businessEnvironmentId')}
                  value={environment.businessEnvironmentId}
                />
                <ReadOnlyValue
                  label={t('operational.configurationState')}
                  value={t('operational.configuredDataAvailable')}
                />
              </dl>
            ) : (
              <p className="mt-5 text-sm text-[var(--danger)]">
                {t('operational.configurationUnavailable')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t('operational.dataSummary')}</h2>
            {snapshot ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric
                  label={t('operational.products')}
                  value={snapshot.menuItems.length}
                />
                <Metric
                  label={t('operational.recipes')}
                  value={snapshot.recipes.length}
                />
                <Metric
                  label={t('operational.ingredients')}
                  value={snapshot.ingredients.length}
                />
                <Metric
                  label={t('operational.suppliers')}
                  value={snapshot.suppliers.length}
                />
                <Metric
                  label={t('operational.employees')}
                  value={snapshot.employees.length}
                />
                <Metric
                  label={t('operational.warehouses')}
                  value={snapshot.warehouses.length}
                />
              </div>
            ) : (
              <div className="skeleton mt-5 h-32 rounded-[16px]" />
            )}
          </CardContent>
        </Card>
      </div>

      {snapshot && inventorySummary && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                {t('operational.availableCatalog')}
              </h2>
              <div className="mt-5 divide-y divide-[var(--border)]">
                {snapshot.menuItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="shrink-0 text-[var(--text-secondary)]">
                      {item.sellingPrice.toLocaleString('ru-RU')} {item.currency}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t('operational.stockPreview')}</h2>
              <div className="mt-5 space-y-4">
                <ReadOnlyValue
                  label={t('operational.openingValue')}
                  value={`${inventorySummary.totalValue.toLocaleString('ru-RU', {
                    maximumFractionDigits: 0,
                  })} ${snapshot.businessProfile.defaultCurrency}`}
                />
                <ReadOnlyValue
                  label={t('operational.lowStock')}
                  value={String(inventorySummary.low)}
                />
                <ReadOnlyValue
                  label={t('operational.zeroStock')}
                  value={String(inventorySummary.zero)}
                />
              </div>
              <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
                {t('operational.readOnlyPreview')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] bg-[var(--subtle)] p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}
