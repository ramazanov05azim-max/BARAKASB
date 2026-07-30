'use client';

import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/i18n/i18n-provider';
import type { TranslationKey } from '@/i18n/config';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function SubscriptionsView({
  projectName,
  projectNameKey,
}: {
  projectName?: string;
  projectNameKey?: TranslationKey;
}) {
  const { t } = useTranslation();
  const resolvedProjectName = projectName ?? (projectNameKey && t(projectNameKey));
  const [annual, setAnnual] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <>
      <PageHeading
        eyebrow={resolvedProjectName ?? t('common.account')}
        title={
          resolvedProjectName
            ? t('subscriptions.titleSingle')
            : t('subscriptions.titleMany')
        }
        description={
          resolvedProjectName
            ? t('subscriptions.descriptionSingle')
            : t('subscriptions.descriptionMany')
        }
      />
      <div className="mb-7 inline-flex rounded-[10px] bg-[var(--subtle)] p-1">
        <button
          onClick={() => setAnnual(false)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${!annual ? 'bg-[var(--surface)] shadow-sm' : 'text-[var(--muted)]'}`}
        >
          {t('subscriptions.monthly')}
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${annual ? 'bg-[var(--surface)] shadow-sm' : 'text-[var(--muted)]'}`}
        >
          {t('subscriptions.annual')}
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Plan
          current
          name={t('subscriptions.foundation')}
          price={t('subscriptions.free')}
          description={t('subscriptions.foundationDescription')}
          features={[
            t('subscriptions.featureOneProject'),
            t('subscriptions.featureMock'),
            t('subscriptions.featureScreens'),
          ]}
          onChoose={() => setMessage(t('subscriptions.foundationActive'))}
        />
        <Plan
          featured
          name={t('subscriptions.business')}
          price={
            annual
              ? t('subscriptions.businessPriceAnnual')
              : t('subscriptions.businessPriceMonthly')
          }
          suffix={t('subscriptions.perMonth')}
          description={t('subscriptions.businessDescription')}
          features={[
            t('subscriptions.featureUnlimitedTeam'),
            t('subscriptions.featureWorkspace'),
            t('subscriptions.featurePriority'),
          ]}
          onChoose={() => setMessage(t('subscriptions.planSimulated'))}
        />
        <Plan
          name={t('subscriptions.scale')}
          price={t('subscriptions.custom')}
          description={t('subscriptions.scaleDescription')}
          features={[
            t('subscriptions.featureControls'),
            t('subscriptions.featureRegional'),
            t('subscriptions.featureDedicated'),
          ]}
          onChoose={() => setMessage(t('subscriptions.salesFuture'))}
        />
      </div>
      {message && (
        <div
          role="status"
          className="mt-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
        >
          {message}
        </div>
      )}
    </>
  );
}

function Plan({
  name,
  price,
  suffix,
  description,
  features,
  featured = false,
  current = false,
  onChoose,
}: {
  name: string;
  price: string;
  suffix?: string;
  description: string;
  features: string[];
  featured?: boolean;
  current?: boolean;
  onChoose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={
        featured ? 'border-[var(--action)] ring-2 ring-[var(--focus-soft)]' : ''
      }
    >
      <CardContent className="p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{name}</h2>
          {featured && (
            <Badge tone="success">
              <Sparkles className="mr-1 size-3" /> {t('subscriptions.recommended')}
            </Badge>
          )}
        </div>
        <p className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
          {price}
          <span className="ml-1 text-sm font-normal text-[var(--muted)]">{suffix}</span>
        </p>
        <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
        <ul className="mt-6 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-4 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          variant={featured ? 'primary' : 'secondary'}
          className="mt-8 w-full"
          onClick={onChoose}
        >
          {current ? t('subscriptions.currentPlan') : t('subscriptions.choosePlan')}
        </Button>
      </CardContent>
    </Card>
  );
}
