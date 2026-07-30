'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { buttonVariants } from '@/components/ui/button';
import { useTranslation } from '@/i18n/i18n-provider';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <Brand />
        <LanguageSwitcher />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-[var(--action)]">{t('notFound.code')}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-[var(--text-secondary)]">
          {t('notFound.description')}
        </p>
        <Link href="/projects" className={`${buttonVariants({ size: 'lg' })} mt-8`}>
          <ArrowLeft className="size-4" /> {t('notFound.returnProjects')}
        </Link>
      </div>
    </main>
  );
}
