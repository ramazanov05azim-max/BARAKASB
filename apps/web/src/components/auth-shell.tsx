'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from '@/i18n/i18n-provider';

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-transparent">
      <div className="network-atmosphere pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -right-24 top-24 size-[420px] rounded-full bg-blue-300/16 blur-3xl" />
      <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="glass-panel w-full max-w-[460px] rounded-[28px] p-6 sm:p-9">
            <div className="mb-8">
              <span className="soft-icon-tile mb-7 grid size-12 place-items-center rounded-[16px] text-sm font-bold">
                {t('common.brandMark')}
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-[36px]">
                {title}
              </h1>
              <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                {description}
              </p>
            </div>
            {children}
            <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              {footer}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-5 text-xs text-[var(--muted)]">
          <Link href="/">{t('auth.privacy')}</Link>
          <Link href="/">{t('auth.security')}</Link>
          <span>{t('common.copyright')}</span>
        </div>
      </div>
    </main>
  );
}
