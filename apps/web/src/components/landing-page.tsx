'use client';

import { motion, MotionConfig } from 'framer-motion';
import { ArrowRight, Check, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BrandNetwork } from './brand-network';
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
    <MotionConfig reducedMotion="user">
      <main className="overflow-hidden bg-transparent">
        <PublicHeader />
        <section className="relative min-h-[880px] pt-36 sm:pt-44">
          <div className="network-atmosphere pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute left-[5%] top-[28%] size-[420px] rounded-full bg-white/80 blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-[18%] size-[420px] rounded-full bg-blue-300/18 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1500px] items-center gap-12 px-5 pb-28 sm:px-8 md:gap-16 xl:grid-cols-[1.08fr_.92fr] xl:gap-8 xl:pb-36">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <h1 className="brand-display text-[clamp(4.4rem,10vw,9.8rem)] font-bold leading-[0.82]">
                {t('common.brandName')}
              </h1>
              <p className="mt-8 max-w-3xl text-balance font-serif text-[clamp(1.65rem,3.2vw,3rem)] leading-[1.08] tracking-[-0.035em] text-[var(--text)]">
                {t('common.tagline')}
              </p>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-[var(--text-secondary)]">
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
              className="relative mx-auto w-full max-w-[760px] xl:max-w-none xl:translate-x-5"
            >
              <BrandNetwork />
            </motion.div>
          </div>
        </section>

        <section
          id="platform"
          className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"
        >
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
                className="glass-panel group rounded-[var(--radius-card)] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
              >
                <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
                  <benefit.icon className="size-5" />
                </span>
                <h3 className="mt-8 text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-4 mb-6 sm:mx-6">
          <div className="glass-panel mx-auto flex max-w-7xl flex-col items-center rounded-[32px] px-5 py-24 text-center sm:px-8">
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.045em]">
              {t('landing.ctaLine1')}
              <br />
              {t('landing.ctaLine2')}
            </h2>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
            >
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
    </MotionConfig>
  );
}
