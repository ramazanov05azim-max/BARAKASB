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
    <main className="min-h-dvh bg-[var(--canvas)]">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-[-0.035em]">{title}</h1>
              <p className="mt-3 leading-6 text-[var(--text-secondary)]">
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
