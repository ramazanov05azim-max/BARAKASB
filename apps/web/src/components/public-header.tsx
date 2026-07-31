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
    <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="floating-chrome mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[20px] px-4 sm:px-6">
        <Brand />
        <nav
          aria-label={t('nav.public')}
          className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 md:flex"
        >
          <Link
            href="/#platform"
            className="rounded-full px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-solid)] hover:text-[var(--text)]"
          >
            {t('nav.platform')}
          </Link>
          <Link
            href="/solutions"
            className="rounded-full px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-solid)] hover:text-[var(--text)]"
          >
            {t('nav.solutions')}
          </Link>
          <Link
            href="/subscriptions"
            className="rounded-full px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-solid)] hover:text-[var(--text)]"
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
