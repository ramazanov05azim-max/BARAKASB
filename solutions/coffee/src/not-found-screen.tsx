'use client';

import { ArrowLeft, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useCoffeeTranslation } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import { Panel, primaryButtonClass } from './ui';

export function CoffeeNotFoundScreen() {
  const { t } = useCoffeeTranslation();
  const { projectId } = useCoffeeWorkspace();
  return (
    <Panel className="px-6 py-16 text-center">
      <Coffee className="mx-auto size-8 text-[var(--action)] dark:text-[var(--action)]" />
      <h1 className="mt-5 text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
        {t('notFound.description')}
      </p>
      <Link
        href={`/projects/${projectId}/coffee`}
        className={`${primaryButtonClass} mt-6`}
      >
        <ArrowLeft className="size-4" />
        {t('notFound.return')}
      </Link>
    </Panel>
  );
}
