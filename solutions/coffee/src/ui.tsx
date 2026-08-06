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
          <p className="mb-3 text-[11px] font-bold tracking-[0.18em] text-[var(--action)] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.048em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
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
    <section className={`glass-panel rounded-[var(--radius-card)] ${className}`}>
      {children}
    </section>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: 'active' | 'inactive' | 'draft' | 'ready' | 'setup-required';
  label?: string;
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
      {label ?? t(key)}
    </span>
  );
}

export function PreviewBanner() {
  const { t } = useCoffeeTranslation();
  return (
    <div className="mb-6 flex items-start gap-3 rounded-[16px] border border-blue-200/70 bg-blue-50/75 px-4 py-3 text-sm text-blue-900 shadow-[inset_0_1px_0_rgb(255_255_255_/_70%)]">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{t('resource.previewNotice')}</span>
    </div>
  );
}

export function PermissionDenied() {
  const { t } = useCoffeeTranslation();
  return (
    <Panel className="px-6 py-14 text-center">
      <LockKeyhole className="mx-auto size-7 text-[var(--action)]" />
      <h1 className="mt-5 text-xl font-semibold">{t('resource.permissionDenied')}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
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
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
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
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-blue-500/30 bg-[linear-gradient(180deg,#2b78ff_0%,var(--action)_100%)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgb(23_105_255_/_24%),inset_0_1px_0_rgb(255_255_255_/_30%)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgb(23_105_255_/_30%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45';

export const secondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-control)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-solid)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45';

export const quietButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-transparent px-3 text-sm font-semibold transition duration-200 hover:border-[var(--border)] hover:bg-[var(--surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:pointer-events-none disabled:opacity-45';

export const inputClass =
  'h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[15px] text-[var(--text)] shadow-[inset_0_1px_0_rgb(255_255_255_/_70%)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--action)] focus:bg-[var(--surface-solid)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:opacity-50';

export const selectClass = `${inputClass} appearance-none bg-none pr-10`;

export const textareaClass =
  'min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[15px] text-[var(--text)] shadow-[inset_0_1px_0_rgb(255_255_255_/_70%)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--action)] focus:bg-[var(--surface-solid)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:opacity-50';
