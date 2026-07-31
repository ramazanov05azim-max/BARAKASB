'use client';

import { ArrowRight, Check, CircleDashed, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import { localBusinessEnvironmentResolver } from '../infrastructure/local-business-environment-directory';
import { localOperationalRuntimeSession } from '../infrastructure/local-operational-runtime-session';
import type {
  BusinessEnvironmentResolver,
  OperationalRuntimeSessionStore,
} from '../application/business-environment-resolution';
import {
  isBusinessEnvironmentCodeComplete,
  normalizeBusinessEnvironmentCode,
} from '../domain/business-environment-code';
import { BusinessEnvironmentCodeInput } from './business-environment-code-input';

type SubmissionState = 'idle' | 'resolving' | 'invalid' | 'error';

export function ConnectionScreen({
  resolver = localBusinessEnvironmentResolver,
  session = localOperationalRuntimeSession,
}: {
  resolver?: BusinessEnvironmentResolver;
  session?: OperationalRuntimeSessionStore;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const isComplete = isBusinessEnvironmentCodeComplete(code);
  const isInvalid = hasInteracted && code.length > 0 && !isComplete;

  function handleCodeChange(value: string): void {
    setCode(normalizeBusinessEnvironmentCode(value));
    setHasInteracted(true);
    setSubmissionState('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setHasInteracted(true);
    if (!isComplete) return;
    setSubmissionState('resolving');
    try {
      const environment = await resolver.resolve(code);
      if (!environment) {
        setSubmissionState('invalid');
        return;
      }
      session.authorize(environment);
      router.push(`/app/runtime/${environment.projectId}`);
    } catch {
      setSubmissionState('error');
    }
  }

  return (
    <section className="w-full max-w-xl" aria-labelledby="connection-title">
      <div className="mb-6 text-center">
        <span className="soft-icon-tile mx-auto grid size-14 place-items-center rounded-[18px]">
          <KeyRound className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
          {t('universal.eyebrow')}
        </p>
        <h1
          id="connection-title"
          className="mt-3 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
        >
          {t('universal.connectTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
          {t('universal.connectDescription')}
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="glass-panel rounded-[28px] p-5 sm:p-7"
        noValidate
      >
        <BusinessEnvironmentCodeInput
          value={code}
          onChange={handleCodeChange}
          invalid={isInvalid}
        />

        <div
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--subtle)] px-4 py-3"
          aria-live="polite"
        >
          {isComplete ? (
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
          ) : (
            <CircleDashed className="mt-0.5 size-4 shrink-0 text-[var(--muted)]" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {t(isComplete ? 'universal.statusReady' : 'universal.statusWaiting')}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
              {t('universal.statusLocalReady')}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          disabled={!isComplete || submissionState === 'resolving'}
        >
          {t(
            submissionState === 'resolving'
              ? 'universal.resolving'
              : 'universal.continue',
          )}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        {(submissionState === 'invalid' || submissionState === 'error') && (
          <p
            role="alert"
            className="mt-4 rounded-[14px] border border-red-400/20 bg-red-50/70 px-3.5 py-3 text-sm leading-5 text-[var(--danger)]"
          >
            {t(
              submissionState === 'invalid'
                ? 'universal.invalidCode'
                : 'universal.resolveError',
            )}
          </p>
        )}
      </form>

      <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-[var(--muted)]">
        {t('universal.whereCode')}
      </p>
    </section>
  );
}
