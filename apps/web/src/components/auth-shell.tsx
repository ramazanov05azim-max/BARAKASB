'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { BrandNetwork } from './brand-network';
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
        <div className="grid flex-1 items-center gap-12 py-10 xl:grid-cols-[1fr_460px] xl:py-8">
          <section className="relative hidden min-h-[690px] xl:block">
            <div className="absolute left-0 top-[12%] z-10">
              <p className="brand-display text-[clamp(5rem,8vw,8.5rem)] leading-[0.82]">
                {t('common.brandName')}
              </p>
              <p className="mt-7 max-w-2xl text-balance font-serif text-[clamp(1.8rem,2.7vw,2.8rem)] leading-[1.08] tracking-[-0.035em]">
                {t('common.tagline')}
              </p>
            </div>
            <BrandNetwork className="absolute bottom-[-3%] right-[-1%] w-[68%] max-w-[520px]" />
          </section>
          <div className="mx-auto w-full max-w-[460px]">
            <p className="mb-7 text-balance text-center font-serif text-2xl leading-tight tracking-[-0.025em] xl:hidden">
              {t('common.tagline')}
            </p>
            <div className="glass-panel rounded-[28px] p-6 sm:p-9">
              <div className="mb-8">
                <span className="mb-7 grid size-12 place-items-center rounded-[16px] border border-blue-400/20 bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-[11px] font-extrabold tracking-[-0.08em] text-white shadow-[0_12px_26px_rgb(23_105_255_/_24%)]">
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
