'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';

export function Brand({
  compact = false,
  className,
  href = '/',
}: {
  compact?: boolean;
  className?: string;
  href?: string;
}) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      aria-label={t('common.brandHome')}
      className={cn(
        'inline-flex items-center gap-2.5 font-semibold tracking-[-0.025em]',
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-[12px] border border-blue-400/20 bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-[10px] font-extrabold tracking-[-0.08em] text-white shadow-[0_10px_24px_rgb(23_105_255_/_24%),inset_0_1px_0_rgb(255_255_255_/_32%)]">
        {t('common.brandMark')}
      </span>
      {!compact && (
        <span className="hidden min-[370px]:inline">{t('common.brandName')}</span>
      )}
    </Link>
  );
}
