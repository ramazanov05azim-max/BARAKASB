'use client';

import {
  ArrowRight,
  Boxes,
  Coffee,
  CookingPot,
  FileBarChart,
  PackageOpen,
  SlidersHorizontal,
  Warehouse,
  Wheat,
} from 'lucide-react';
import Link from 'next/link';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import { PageHeader, Panel, PreviewBanner } from './ui';

export function MenuHubScreen() {
  const { t } = useCoffeeTranslation();
  const { projectId, snapshot } = useCoffeeWorkspace();
  const base = `/projects/${projectId}/coffee`;
  const items = [
    {
      key: 'nav.categories' as CoffeeTranslationKey,
      href: `${base}/menu/categories`,
      icon: Boxes,
      count: snapshot?.menuCategories.length ?? 0,
    },
    {
      key: 'nav.items' as CoffeeTranslationKey,
      href: `${base}/menu/items`,
      icon: Coffee,
      count: snapshot?.menuItems.length ?? 0,
    },
    {
      key: 'nav.modifiers' as CoffeeTranslationKey,
      href: `${base}/menu/modifiers`,
      icon: SlidersHorizontal,
      count: snapshot?.modifiers.length ?? 0,
    },
    {
      key: 'nav.recipes' as CoffeeTranslationKey,
      href: `${base}/recipes`,
      icon: CookingPot,
      count: snapshot?.recipes.length ?? 0,
    },
  ];
  return (
    <>
      <PageHeader title={t('menu.title')} description={t('menu.description')} />
      <PreviewBanner />
      <HubGrid items={items} />
    </>
  );
}

export function InventoryHubScreen() {
  const { t } = useCoffeeTranslation();
  const { projectId, snapshot } = useCoffeeWorkspace();
  const base = `/projects/${projectId}/coffee`;
  const items = [
    {
      key: 'nav.ingredients' as CoffeeTranslationKey,
      href: `${base}/inventory/ingredients`,
      icon: Wheat,
      count: snapshot?.ingredients.length ?? 0,
    },
    {
      key: 'nav.units' as CoffeeTranslationKey,
      href: `${base}/inventory/units`,
      icon: PackageOpen,
      count: snapshot?.units.length ?? 0,
    },
    {
      key: 'nav.warehouses' as CoffeeTranslationKey,
      href: `${base}/inventory/warehouses`,
      icon: Warehouse,
      count: snapshot?.warehouses.length ?? 0,
    },
  ];
  return (
    <>
      <PageHeader
        title={t('inventory.title')}
        description={t('inventory.description')}
      />
      <PreviewBanner />
      <HubGrid items={items} />
    </>
  );
}

function HubGrid({
  items,
}: {
  items: Array<{
    key: CoffeeTranslationKey;
    href: string;
    icon: typeof Coffee;
    count: number;
  }>;
}) {
  const { t } = useCoffeeTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Panel className="h-full p-6 transition hover:-translate-y-0.5 hover:border-black/18 dark:hover:border-white/20">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--action-soft)] text-[var(--action)] dark:bg-[var(--action-soft)] dark:text-[var(--action)]">
                  <Icon className="size-5" />
                </span>
                <span className="text-2xl font-semibold tracking-[-0.03em]">
                  {item.count}
                </span>
              </div>
              <h2 className="mt-7 text-lg font-semibold">{t(item.key)}</h2>
              <p className="mt-4 flex items-center text-sm font-semibold text-[var(--action)] dark:text-[var(--action)]">
                {t('common.open')}
                <ArrowRight className="ml-auto size-4" />
              </p>
            </Panel>
          </Link>
        );
      })}
    </div>
  );
}

export function ReportsPlaceholderScreen() {
  const { t } = useCoffeeTranslation();
  return (
    <>
      <PageHeader title={t('reports.title')} description={t('reports.description')} />
      <Panel className="px-6 py-16 text-center">
        <FileBarChart className="mx-auto size-8 text-[var(--action)] dark:text-[var(--action)]" />
        <h2 className="mt-5 text-xl font-semibold">{t('reports.emptyTitle')}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
          {t('reports.emptyText')}
        </p>
        <span className="mt-5 inline-flex rounded-full bg-[var(--subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] dark:bg-white/8 dark:text-[var(--text-secondary)]">
          {t('common.configurationOnly')}
        </span>
      </Panel>
    </>
  );
}
