'use client';

import {
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  Coffee,
  CookingPot,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import { PageHeader, Panel, RepositoryErrorState, StatusBadge } from './ui';

export function CoffeeDashboardScreen() {
  const { t, locale } = useCoffeeTranslation();
  const { projectId, snapshot, error } = useCoffeeWorkspace();
  const base = `/projects/${projectId}/coffee`;

  const incomplete = snapshot?.setupSteps.find((step) => step.status === 'incomplete');
  const completed =
    snapshot?.setupSteps.filter((step) => step.status === 'complete').length ?? 0;
  const total = snapshot?.setupSteps.length ?? 14;
  const progress = Math.round((completed / total) * 100);

  const warnings = useMemo(() => {
    if (!snapshot) return [];
    const items: Array<{ key: CoffeeTranslationKey; href: string }> = [];
    if (snapshot.locations.length === 0) {
      items.push({ key: 'dashboard.warningLocation', href: `${base}/setup/locations` });
    }
    if (snapshot.menuCategories.length === 0 || snapshot.menuItems.length === 0) {
      items.push({ key: 'dashboard.warningMenu', href: `${base}/menu` });
    }
    if (snapshot.recipes.length === 0) {
      items.push({ key: 'dashboard.warningRecipe', href: `${base}/recipes` });
    }
    if (snapshot.employees.length === 0) {
      items.push({ key: 'dashboard.warningTeam', href: `${base}/employees` });
    }
    return items;
  }, [base, snapshot]);

  if (error) return <RepositoryErrorState />;
  if (!snapshot) return null;

  const modules: Array<{
    key: CoffeeTranslationKey;
    textKey: CoffeeTranslationKey;
    href: string;
    icon: typeof Coffee;
  }> = [
    {
      key: 'dashboard.moduleMenu',
      textKey: 'dashboard.moduleMenuText',
      href: `${base}/menu`,
      icon: Coffee,
    },
    {
      key: 'dashboard.moduleRecipes',
      textKey: 'dashboard.moduleRecipesText',
      href: `${base}/recipes`,
      icon: CookingPot,
    },
    {
      key: 'dashboard.moduleTeam',
      textKey: 'dashboard.moduleTeamText',
      href: `${base}/employees`,
      icon: Users,
    },
    {
      key: 'dashboard.moduleLocations',
      textKey: 'dashboard.moduleLocationsText',
      href: `${base}/workstations`,
      icon: Building2,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={`${snapshot.project.name} ${t('dashboard.titleSuffix')}`}
        description={t('dashboard.description')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="active" />
            <StatusBadge status={snapshot.project.ready ? 'ready' : 'setup-required'} />
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--border)] p-6 dark:border-white/10 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">{t('dashboard.setupTitle')}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                  {t('dashboard.setupDescription')}
                </p>
              </div>
              <span className="text-2xl font-semibold tracking-[-0.03em]">
                {progress}%
              </span>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-blue-100/60 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--action),#7ca4ff)] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="p-6 sm:p-7">
            {incomplete ? (
              <>
                <p className="text-xs font-semibold tracking-[0.1em] text-[var(--action)] uppercase dark:text-[var(--action)]">
                  {t('dashboard.nextAction')}
                </p>
                <Link
                  href={`${base}${incomplete.hrefSuffix}`}
                  className="mt-3 flex items-center gap-4 rounded-2xl bg-[var(--subtle)] p-4 transition hover:bg-[var(--canvas-strong)] dark:bg-white/6 dark:hover:bg-white/10"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white dark:bg-white/10">
                    <ArrowRight className="size-4 text-[var(--action)] dark:text-[var(--action)]" />
                  </span>
                  <span className="font-semibold">
                    {t(incomplete.labelKey as CoffeeTranslationKey)}
                  </span>
                  <ArrowRight className="ml-auto size-4" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Check className="size-5" />
                {t('setup.readySuccess')}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">{t('dashboard.todayTitle')}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                {t('dashboard.todayPreview')}
              </p>
            </div>
            <span className="rounded-full bg-[var(--subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] dark:bg-white/8 dark:text-[var(--text-secondary)]">
              {t('common.preview')}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['dashboard.revenue', 'dashboard.orders', 'dashboard.averageReceipt'].map(
              (key) => (
                <div
                  key={key}
                  className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/5"
                >
                  <p className="text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                    {t(key as CoffeeTranslationKey)}
                  </p>
                  <p className="mt-2 text-xl font-semibold">—</p>
                </div>
              ),
            )}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            <CircleAlert className="size-3.5" />
            {t('dashboard.noOperationalData')}
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold">{t('dashboard.warnings')}</h2>
          <div className="mt-5 space-y-2">
            {warnings.length ? (
              warnings.map((warning) => (
                <Link
                  key={warning.key}
                  href={warning.href}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <CircleAlert className="size-4 shrink-0" />
                  {t(warning.key)}
                  <ArrowRight className="ml-auto size-4" />
                </Link>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <Check className="size-4" />
                {t('dashboard.noWarnings')}
              </p>
            )}
          </div>
        </Panel>

        <Panel className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold">{t('dashboard.activity')}</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            {t('dashboard.activityDescription')}
          </p>
          <div className="mt-5 divide-y divide-[var(--border)] dark:divide-white/8">
            {snapshot.activities.slice(0, 4).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="mt-1.5 size-2 rounded-full bg-[var(--action)]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {t(activity.actionKey as CoffeeTranslationKey)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                    {activity.target} ·{' '}
                    {new Intl.DateTimeFormat(locale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(activity.occurredAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">{t('dashboard.modules')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.key} href={module.href}>
                <Panel className="h-full p-5 transition hover:-translate-y-0.5 hover:border-black/18 dark:hover:border-white/20">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--action-soft)] text-[var(--action)] dark:bg-[var(--action-soft)] dark:text-[var(--action)]">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-5 font-semibold">{t(module.key)}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                    {t(module.textKey)}
                  </p>
                </Panel>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
