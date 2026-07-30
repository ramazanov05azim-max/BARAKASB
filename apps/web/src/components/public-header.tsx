'use client';

import Link from 'next/link';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { buttonVariants } from './ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const { t } = useTranslation();

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav aria-label={t('nav.public')} className="hidden items-center gap-7 md:flex">
          <Link
            href="/#platform"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {t('nav.platform')}
          </Link>
          <Link
            href="/solutions"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {t('nav.solutions')}
          </Link>
          <Link
            href="/subscriptions"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {t('nav.pricing')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: 'quiet', size: 'sm' }),
              'hidden sm:inline-flex',
            )}
          >
            {t('nav.signIn')}
          </Link>
          <Link href="/register" className={buttonVariants({ size: 'sm' })}>
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </header>
  );
}
