'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Link
      href="/"
      aria-label={t('common.brandHome')}
      className={cn(
        'inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em]',
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--text)] text-[12px] font-bold text-[var(--surface)]">
        {t('common.brandMark')}
      </span>
      {!compact && <span>{t('common.brandName')}</span>}
    </Link>
  );
}
