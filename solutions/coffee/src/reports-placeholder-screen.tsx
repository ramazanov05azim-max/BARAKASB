'use client';

import { FileBarChart } from 'lucide-react';
import { useCoffeeTranslation } from './i18n';
import { PageHeader, Panel } from './ui';

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
