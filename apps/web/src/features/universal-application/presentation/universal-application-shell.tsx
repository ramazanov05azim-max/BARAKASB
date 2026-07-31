'use client';

import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/i18n/i18n-provider';
import { solutionApplicationConfig } from '../config';

export function UniversalApplicationShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="network-atmosphere pointer-events-none absolute inset-0 opacity-55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18rem] size-[44rem] -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl"
      />

      <header className="relative z-10 px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <Brand href="/app" />
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-8.5rem)] w-full max-w-[1600px] items-center justify-center px-[max(1rem,env(safe-area-inset-left))] py-10 sm:py-14 lg:h-[calc(100dvh-8rem)] lg:min-h-0 lg:items-start lg:py-4">
        {children}
      </main>

      <footer className="relative z-10 flex min-h-12 items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-[var(--muted)]">
        {t('universal.footerVersion')} {solutionApplicationConfig.applicationVersion}
      </footer>
    </div>
  );
}
