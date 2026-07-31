'use client';

import { Languages } from 'lucide-react';
import { useTranslation } from '@/i18n/i18n-provider';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <label
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs font-semibold shadow-[var(--shadow-control)] backdrop-blur-xl',
        className,
      )}
    >
      <Languages className="size-3.5 text-[var(--muted)]" aria-hidden="true" />
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t('language.label')}
        className="cursor-pointer bg-transparent outline-none"
      >
        <option value="ru">
          {t(compact ? 'language.shortRussian' : 'language.russian')}
        </option>
        <option value="en">
          {t(compact ? 'language.shortEnglish' : 'language.english')}
        </option>
      </select>
    </label>
  );
}
