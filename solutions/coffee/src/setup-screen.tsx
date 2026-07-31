'use client';

import { ArrowRight, Check, Circle, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import {
  PageHeader,
  Panel,
  RepositoryErrorState,
  primaryButtonClass,
  secondaryButtonClass,
} from './ui';

export function CoffeeSetupScreen() {
  const { t } = useCoffeeTranslation();
  const { projectId, snapshot, error, completeSetupStep, markReady, can } =
    useCoffeeWorkspace();
  const base = `/projects/${projectId}/coffee`;

  if (error) return <RepositoryErrorState />;
  if (!snapshot) return null;

  const complete = snapshot.setupSteps.filter(
    (step) => step.status === 'complete',
  ).length;
  const progress = Math.round((complete / snapshot.setupSteps.length) * 100);
  const current = snapshot.setupSteps.find((step) => step.status === 'incomplete');
  const canManage = can('project.manage') || can('settings.manage');

  return (
    <>
      <PageHeader
        eyebrow={t('setup.eyebrow')}
        title={t('setup.title')}
        description={t('setup.description')}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel className="overflow-hidden">
          <div className="border-b border-black/8 p-6 dark:border-white/10 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t('setup.progress')}</p>
                <p className="mt-1 text-xs text-[#766b61] dark:text-[#aaa096]">
                  {complete} / {snapshot.setupSteps.length}
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-[-0.04em]">{progress}%</p>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/6 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[#8a5c3d] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ol className="divide-y divide-black/7 dark:divide-white/8">
            {snapshot.setupSteps.map((step, index) => {
              const label = t(step.labelKey as CoffeeTranslationKey);
              const isReview = step.id === 'review';
              const isReady = step.id === 'ready';
              return (
                <li key={step.id} className="flex items-center gap-4 px-5 py-4 sm:px-7">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full ${
                      step.status === 'complete'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : step.status === 'incomplete'
                          ? 'bg-[#efe2d6] text-[#6f442d] dark:bg-[#4a3023] dark:text-[#ecc7a8]'
                          : 'bg-black/5 text-[#9a9087] dark:bg-white/7'
                    }`}
                  >
                    {step.status === 'complete' ? (
                      <Check className="size-4" />
                    ) : step.status === 'blocked' ? (
                      <LockKeyhole className="size-3.5" />
                    ) : (
                      <Circle className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-0.5 text-xs text-[#766b61] dark:text-[#aaa096]">
                      {step.status === 'complete'
                        ? t('setup.completed')
                        : step.status === 'incomplete'
                          ? t('setup.incomplete')
                          : t('setup.blocked')}
                    </p>
                  </div>
                  <span className="ml-auto hidden text-xs text-[#9a9087] sm:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {step.status === 'incomplete' && !isReview && !isReady ? (
                    <Link
                      href={`${base}${step.hrefSuffix}`}
                      className={secondaryButtonClass}
                    >
                      {t('setup.openStep')}
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                  {isReview && step.status === 'incomplete' ? (
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => void completeSetupStep('review')}
                      className={secondaryButtonClass}
                    >
                      {t('setup.markReviewComplete')}
                    </button>
                  ) : null}
                  {isReady && step.status === 'incomplete' ? (
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => void markReady()}
                      className={primaryButtonClass}
                    >
                      {t('setup.markReady')}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-6">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#8a5c3d] uppercase dark:text-[#d6a77f]">
              {t('setup.recommended')}
            </p>
            <h2 className="mt-3 text-lg font-semibold">
              {current
                ? t(current.labelKey as CoffeeTranslationKey)
                : t('setup.readySuccess')}
            </h2>
            {current && current.id !== 'review' && current.id !== 'ready' ? (
              <Link
                href={`${base}${current.hrefSuffix}`}
                className={`${primaryButtonClass} mt-5 w-full`}
              >
                {t('setup.openStep')}
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </Panel>
          <Panel className="p-6">
            <h2 className="font-semibold">{t('header.readyForOperations')}</h2>
            <p className="mt-2 text-sm leading-6 text-[#766b61] dark:text-[#aaa096]">
              {snapshot.project.ready
                ? t('setup.readySuccess')
                : t('setup.readyBlocked')}
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
              {snapshot.project.ready ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <LockKeyhole className="size-4 text-amber-600" />
              )}
              {snapshot.project.ready
                ? t('header.readyForOperations')
                : t('header.notReady')}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
