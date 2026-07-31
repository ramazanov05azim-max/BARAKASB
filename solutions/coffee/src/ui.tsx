'use client';

import { CircleAlert, LockKeyhole, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#8a5c3d] uppercase dark:text-[#d6a77f]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766b61] dark:text-[#aaa096]">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-black/8 bg-[#fffefa] dark:border-white/10 dark:bg-[#1c1916] ${className}`}
    >
      {children}
    </section>
  );
}

export function StatusBadge({
  status,
}: {
  status: 'active' | 'inactive' | 'draft' | 'ready' | 'setup-required';
}) {
  const { t } = useCoffeeTranslation();
  const key: CoffeeTranslationKey =
    status === 'active'
      ? 'common.active'
      : status === 'inactive'
        ? 'common.inactive'
        : status === 'draft'
          ? 'common.draft'
          : status === 'ready'
            ? 'common.ready'
            : 'common.setupRequired';
  const tone =
    status === 'active' || status === 'ready'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : status === 'inactive'
        ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold ${tone}`}
    >
      {t(key)}
    </span>
  );
}

export function PreviewBanner() {
  const { t } = useCoffeeTranslation();
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{t('resource.previewNotice')}</span>
    </div>
  );
}

export function PermissionDenied() {
  const { t } = useCoffeeTranslation();
  return (
    <Panel className="px-6 py-14 text-center">
      <LockKeyhole className="mx-auto size-7 text-[#8a5c3d] dark:text-[#d6a77f]" />
      <h1 className="mt-5 text-xl font-semibold">{t('resource.permissionDenied')}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#766b61] dark:text-[#aaa096]">
        {t('resource.permissionDeniedText')}
      </p>
    </Panel>
  );
}

export function RepositoryErrorState() {
  const { t } = useCoffeeTranslation();
  const { reload } = useCoffeeWorkspace();
  return (
    <Panel className="px-6 py-14 text-center">
      <CircleAlert className="mx-auto size-7 text-red-600" />
      <h1 className="mt-5 text-xl font-semibold">{t('resource.repositoryError')}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#766b61] dark:text-[#aaa096]">
        {t('resource.repositoryErrorText')}
      </p>
      <button
        type="button"
        onClick={() => void reload()}
        className={`${primaryButtonClass} mt-6`}
      >
        <RefreshCw className="size-4" />
        {t('resource.retry')}
      </button>
    </Panel>
  );
}

export const primaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4c2f22] px-4 text-sm font-semibold text-white transition hover:bg-[#3c251b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b55] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45';

export const secondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#211d18] transition hover:bg-[#f3efe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b55] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 dark:border-white/12 dark:bg-[#211d19] dark:text-[#f7f2eb] dark:hover:bg-white/8';

export const quietButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b55] disabled:pointer-events-none disabled:opacity-45 dark:hover:bg-white/8';

export const inputClass =
  'h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[15px] outline-none transition placeholder:text-[#9a9087] focus:border-[#8a5c3d] focus:ring-2 focus:ring-[#8a5c3d]/15 disabled:opacity-50 dark:border-white/12 dark:bg-[#211d19]';

export const textareaClass =
  'min-h-28 w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-3 text-[15px] outline-none transition placeholder:text-[#9a9087] focus:border-[#8a5c3d] focus:ring-2 focus:ring-[#8a5c3d]/15 disabled:opacity-50 dark:border-white/12 dark:bg-[#211d19]';
