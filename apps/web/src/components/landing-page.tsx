'use client';

import { motion, MotionConfig } from 'framer-motion';
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
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
        <section className="relative min-h-[720px] pt-32 sm:pt-36">
          <div className="network-atmosphere pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute left-[5%] top-[28%] size-[420px] rounded-full bg-white/80 blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-[18%] size-[420px] rounded-full bg-blue-300/18 blur-3xl" />
          <div
            className="pointer-events-none absolute left-0 top-[70%] hidden h-px w-[17vw] max-w-[290px] bg-[linear-gradient(90deg,var(--action),rgb(23_105_255_/_58%))] md:block"
            aria-hidden="true"
          >
            <span className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--action)] shadow-[0_0_0_4px_rgb(23_105_255_/_8%)]" />
          </div>
          <div className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-5 pb-24 sm:px-8 md:min-h-[590px] md:grid-cols-[1.04fr_.96fr] md:gap-2 md:px-10 md:pb-20 lg:min-h-[650px] lg:px-16 xl:px-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="relative z-10 md:-translate-y-3"
            >
              <h1 className="brand-display whitespace-nowrap text-[clamp(4rem,10vw,10rem)] leading-[0.82]">
                {t('common.brandName')}
              </h1>
              <p className="mt-7 max-w-3xl font-serif text-[clamp(1.45rem,2.2vw,2.25rem)] leading-[1.08] tracking-[-0.035em] text-[var(--text)] md:mt-8 lg:whitespace-nowrap">
                {t('common.tagline')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-[660px] md:w-[112%] md:max-w-[740px]"
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
