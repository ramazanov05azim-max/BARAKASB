'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PublicHeader } from './public-header';
import { buttonVariants } from './ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const { t } = useTranslation();
  const benefits = [
    {
      icon: Layers3,
      title: t('landing.benefitOneTitle'),
      text: t('landing.benefitOneText'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.benefitTwoTitle'),
      text: t('landing.benefitTwoText'),
    },
    {
      icon: Sparkles,
      title: t('landing.benefitThreeTitle'),
      text: t('landing.benefitThreeText'),
    },
  ];

  return (
    <main className="overflow-hidden bg-[var(--canvas)]">
      <PublicHeader />
      <section className="relative min-h-[760px] border-b border-[var(--border)] pt-32 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 surface-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t('landing.badge')}
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {t('landing.titleLine1')}
              <br />
              {t('landing.titleLine2')}
            </h1>
            <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-[var(--text-secondary)]">
              {t('landing.description')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'lg' }), 'group')}
              >
                {t('landing.createAccount')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: 'secondary', size: 'lg' })}
              >
                {t('nav.signIn')}
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--muted)]">
              <Check className="size-4 text-emerald-600" />
              {t('landing.prototypeAccess')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-12 -z-10 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_30px_100px_rgba(15,23,42,.12)]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 pb-3">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-[var(--muted)]">
                  {t('landing.previewProjects')}
                </span>
              </div>
              <div className="grid gap-3 p-2 pt-5 sm:grid-cols-2">
                <PreviewProject
                  name={t('landing.previewNorthStar')}
                  category={t('landing.previewCoffee')}
                  role={t('landing.previewOwner')}
                  tone="amber"
                />
                <PreviewProject
                  name={t('landing.previewFieldNotes')}
                  category={t('landing.previewStore')}
                  role={t('landing.previewOwner')}
                  tone="blue"
                />
              </div>
              <div className="m-2 mt-3 rounded-[14px] bg-[var(--subtle)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {t('landing.previewAttention')}
                </p>
                <div className="mt-4 space-y-3">
                  <PreviewRow
                    title={t('landing.previewFinishSetup')}
                    detail={t('landing.previewStepsRemaining')}
                  />
                  <PreviewRow
                    title={t('landing.previewInviteTeam')}
                    detail={t('landing.previewReady')}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--action)]">
            {t('landing.focusEyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t('landing.focusTitle')}
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-7"
            >
              <benefit.icon className="size-6 text-[var(--action)]" />
              <h3 className="mt-8 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center sm:px-8">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.045em]">
            {t('landing.ctaLine1')}
            <br />
            {t('landing.ctaLine2')}
          </h2>
          <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
            {t('nav.getStarted')} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>{t('common.copyright')}</span>
        <div className="flex gap-5">
          <Link href="/login">{t('nav.signIn')}</Link>
          <Link href="/solutions">{t('nav.solutions')}</Link>
          <Link href="/subscriptions">{t('nav.pricing')}</Link>
        </div>
      </footer>
    </main>
  );
}

function PreviewProject({
  name,
  category,
  role,
  tone,
}: {
  name: string;
  category: string;
  role: string;
  tone: 'amber' | 'blue';
}) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] p-5">
      <div
        className={cn(
          'size-10 rounded-[12px]',
          tone === 'amber' ? 'bg-amber-100' : 'bg-blue-100',
        )}
      />
      <p className="mt-7 font-semibold">{name}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {category} · {role}
      </p>
    </div>
  );
}

function PreviewRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] bg-[var(--surface)] px-3 py-3">
      <span className="size-2 rounded-full bg-[var(--action)]" />
      <span className="text-sm font-medium">{title}</span>
      <span className="ml-auto text-xs text-[var(--muted)]">{detail}</span>
    </div>
  );
}
