'use client';

import { motion, MotionConfig } from 'framer-motion';
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
    <MotionConfig reducedMotion="user">
      <main className="overflow-hidden bg-transparent">
        <PublicHeader />
        <section className="relative min-h-[820px] pt-36 sm:pt-44">
          <div className="network-atmosphere pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute left-[5%] top-[28%] size-[420px] rounded-full bg-white/80 blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-[18%] size-[420px] rounded-full bg-blue-300/18 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-28 sm:px-8 md:gap-16 xl:grid-cols-[.92fr_1.08fr] xl:pb-36">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="glass-panel mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold">
                <span className="size-2 rounded-full bg-[var(--action)] shadow-[0_0_0_5px_var(--action-soft)]" />
                {t('landing.badge')}
              </div>
              <h1 className="max-w-3xl text-balance text-6xl font-semibold leading-[.94] tracking-[-0.07em] sm:text-7xl xl:text-[82px]">
                {t('landing.titleLine1')}
                <br />
                {t('landing.titleLine2')}
              </h1>
              <p className="mt-8 max-w-xl text-balance font-serif text-xl leading-8 text-[var(--text-secondary)] sm:text-2xl sm:leading-9">
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
              <ConceptNetwork
                projectOne={t('landing.previewNorthStar')}
                projectTwo={t('landing.previewFieldNotes')}
                coffee={t('landing.previewCoffee')}
                store={t('landing.previewStore')}
              />
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

function ConceptNetwork({
  projectOne,
  projectTwo,
  coffee,
  store,
}: {
  projectOne: string;
  projectTwo: string;
  coffee: string;
  store: string;
}) {
  return (
    <div className="relative mx-auto aspect-[1.08/1] w-full max-w-[620px]">
      <div className="absolute inset-[8%] rounded-full bg-blue-200/22 blur-3xl" />
      <svg
        viewBox="0 0 620 570"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d="M310 282 C310 190 218 190 218 132"
          fill="none"
          stroke="rgb(23 105 255 / 62%)"
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M310 282 C420 282 418 150 500 150"
          fill="none"
          stroke="rgb(23 105 255 / 62%)"
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M310 282 C310 402 220 402 220 470"
          fill="none"
          stroke="rgb(23 105 255 / 44%)"
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M310 282 C410 282 410 450 500 450"
          fill="none"
          stroke="rgb(23 105 255 / 62%)"
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="310" cy="282" r="4" fill="#1769ff" />
        <circle cx="218" cy="132" r="4" fill="#1769ff" />
        <circle cx="500" cy="150" r="4" fill="#1769ff" />
        <circle cx="220" cy="470" r="4" fill="#8aa9eb" />
        <circle cx="500" cy="450" r="4" fill="#1769ff" />
      </svg>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="floating-chrome absolute left-1/2 top-1/2 grid size-[31%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px] border-blue-200/70"
      >
        <div className="grid size-[62%] place-items-center rounded-full border border-blue-200/80 bg-blue-50/75 shadow-[inset_0_0_32px_rgb(23_105_255_/_8%)]">
          <div className="grid size-[54%] place-items-center rounded-full border border-blue-200/80 bg-white shadow-[0_12px_30px_rgb(23_105_255_/_14%)]">
            <span className="size-[44%] rounded-full bg-[linear-gradient(145deg,#1769ff,#7597f8)] shadow-[0_8px_18px_rgb(23_105_255_/_30%)]" />
          </div>
        </div>
      </motion.div>

      <NetworkCard
        className="left-[2%] top-[5%]"
        label={projectOne}
        detail={coffee}
        delay={0}
      />
      <NetworkCard
        className="right-0 top-[11%]"
        label={projectTwo}
        detail={store}
        delay={0.2}
      />
      <NetworkCard
        className="bottom-[3%] left-[8%]"
        label={coffee}
        detail={projectOne}
        delay={0.35}
      />
      <NetworkCard
        className="bottom-[7%] right-[2%]"
        label={store}
        detail={projectTwo}
        delay={0.5}
      />
    </div>
  );
}

function NetworkCard({
  className,
  label,
  detail,
  delay,
}: {
  className: string;
  label: string;
  detail: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={cn(
        'glass-panel absolute w-[38%] rounded-[22px] p-3.5 sm:p-4',
        className,
      )}
    >
      <span className="mb-3 block size-3 rounded-full bg-[var(--action)] shadow-[0_0_0_5px_var(--action-soft)]" />
      <div className="flex items-center gap-3">
        <span className="soft-icon-tile size-11 shrink-0 rounded-[13px]" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold sm:text-sm">
            {label}
          </span>
          <span className="mt-1 block truncate text-[10px] text-[var(--muted)] sm:text-xs">
            {detail}
          </span>
        </span>
      </div>
      <span className="mt-3 flex justify-end gap-1">
        <span className="size-1.5 rounded-full bg-[var(--action)]" />
        <span className="size-1.5 rounded-full bg-slate-200" />
        <span className="size-1.5 rounded-full bg-slate-200" />
      </span>
    </motion.div>
  );
}
