'use client';

import { ArrowLeft, CloudOff } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';
import { universalApplicationRoutes } from '../routes';

export function UnavailableScreen() {
  const { t } = useTranslation();

  return (
    <section className="glass-panel w-full max-w-lg rounded-[28px] p-7 text-center sm:p-10">
      <span className="soft-icon-tile mx-auto grid size-14 place-items-center rounded-[18px]">
        <CloudOff className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
        {t('universal.unavailableTitle')}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {t('universal.unavailableDescription')}
      </p>
      <Link
        href={universalApplicationRoutes.root}
        className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'mt-7')}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('universal.tryAgain')}
      </Link>
    </section>
  );
}
