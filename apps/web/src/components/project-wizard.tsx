'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  ConciergeBell,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useTranslation } from '@/i18n/i18n-provider';
import type { TranslationKey } from '@/i18n/config';
import { localCoffeeManagerSetupRepository } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import {
  mockRepository,
  type CategoryId,
  type SolutionId,
} from '@/lib/mock-repository';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'food',
    nameKey: 'common.foodBeverage',
    descriptionKey: 'wizard.foodDescription',
    icon: Coffee,
    available: true,
  },
  {
    id: 'retail',
    nameKey: 'common.retail',
    descriptionKey: 'wizard.retailDescription',
    icon: ShoppingBag,
    available: false,
  },
  {
    id: 'services',
    nameKey: 'common.services',
    descriptionKey: 'wizard.servicesDescription',
    icon: ConciergeBell,
    available: false,
  },
] satisfies Array<{
  id: CategoryId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: typeof Coffee;
  available: boolean;
}>;

export function ProjectWizard({ directCoffee = false }: { directCoffee?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(directCoffee ? 2 : 0);
  const [category, setCategory] = useState<CategoryId | ''>(directCoffee ? 'food' : '');
  const [solution, setSolution] = useState<SolutionId | ''>(
    directCoffee ? 'coffee' : '',
  );
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const steps = [
    t('wizard.stepCategory'),
    t('wizard.stepSolution'),
    t('wizard.stepName'),
    t('wizard.stepConfirm'),
  ];
  const projectNameSchema = z
    .string()
    .trim()
    .min(2, t('validation.nameMinTwo'))
    .max(60, t('validation.nameMaxSixty'));

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === category),
    [category],
  );

  const next = () => {
    setError('');
    if (step === 0 && !category) return setError(t('wizard.errorCategory'));
    if (step === 1 && !solution) return setError(t('wizard.errorSolution'));
    if (step === 2) {
      const result = projectNameSchema.safeParse(name);
      if (!result.success)
        return setError(result.error.issues[0]?.message ?? t('wizard.errorName'));
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const create = async () => {
    if (!solution) {
      setError(t('wizard.errorSolution'));
      return;
    }
    setCreating(true);
    setError('');
    try {
      const project = await mockRepository.createProject({
        name,
        categoryId: selectedCategory?.id ?? 'food',
        solutionId: solution,
      });
      if (solution === 'coffee') {
        await localCoffeeManagerSetupRepository.install(project);
        router.push(`/projects/${project.id}/admin/solutions/coffee/setup`);
      } else {
        router.push(`/projects/${project.id}`);
      }
    } catch {
      setError(t('wizard.errorCreate'));
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--action)]">
          {t('wizard.eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl">
          {step === 0 && t('wizard.titleCategory')}
          {step === 1 && t('wizard.titleSolution')}
          {step === 2 && t('wizard.titleName')}
          {step === 3 && t('wizard.titleConfirm')}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[var(--text-secondary)]">
          {step === 0 && t('wizard.descriptionCategory')}
          {step === 1 && t('wizard.descriptionSolution')}
          {step === 2 && t('wizard.descriptionName')}
          {step === 3 && t('wizard.descriptionConfirm')}
        </p>
      </div>

      <ol
        className="mb-9 grid grid-cols-4 gap-2"
        aria-label={t('wizard.progressLabel')}
      >
        {steps.map((label, index) => (
          <li key={label}>
            <div
              className={cn(
                'h-1 rounded-full',
                index <= step ? 'bg-[var(--action)]' : 'bg-[var(--border)]',
              )}
            />
            <span
              className={cn(
                'mt-2 hidden text-xs sm:block',
                index === step
                  ? 'font-semibold text-[var(--text)]'
                  : 'text-[var(--muted)]',
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {categories.map((item) => (
            <button
              key={item.id}
              disabled={!item.available}
              onClick={() => setCategory(item.id)}
              className={cn(
                'glass-panel min-h-52 rounded-[var(--radius-card)] p-6 text-left outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
                category === item.id
                  ? 'border-[var(--action)] bg-blue-50/80 ring-4 ring-[var(--focus-soft)]'
                  : 'hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-float)]',
                !item.available && 'cursor-not-allowed opacity-55',
              )}
            >
              <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-10 font-semibold">{t(item.nameKey)}</h2>
              <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                {t(item.descriptionKey)}
              </p>
              {!item.available && (
                <Badge className="mt-4">{t('common.comingSoon')}</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <button
          onClick={() => setSolution('coffee')}
          className={cn(
            'glass-panel w-full rounded-[var(--radius-card)] p-7 text-left outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
            solution === 'coffee'
              ? 'border-[var(--action)] ring-2 ring-[var(--focus-soft)]'
              : 'border-[var(--border)]',
          )}
        >
          <div className="flex items-start gap-5">
            <span className="soft-icon-tile grid size-14 shrink-0 place-items-center rounded-[18px]">
              <Coffee className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{t('common.coffee')}</h2>
                <Badge tone="success">{t('common.available')}</Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                {t('wizard.coffeeDescription')}
              </p>
            </div>
          </div>
        </button>
      )}

      {step === 2 && (
        <Card>
          <CardContent>
            <Label htmlFor="projectName">{t('wizard.projectName')}</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              className="mt-2"
              autoFocus
              maxLength={60}
              placeholder={t('wizard.projectPlaceholder')}
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              {t('wizard.renameLater')}
            </p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-7">
            <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
              <Sparkles className="size-5" />
            </span>
            <dl className="mt-8 divide-y divide-[var(--border)]">
              <Summary label={t('wizard.summaryProject')} value={name} />
              <Summary
                label={t('wizard.summaryCategory')}
                value={
                  selectedCategory
                    ? t(selectedCategory.nameKey)
                    : t('common.foodBeverage')
                }
              />
              <Summary label={t('wizard.summarySolution')} value={t('common.coffee')} />
              <Summary label={t('wizard.summaryRole')} value={t('common.owner')} />
            </dl>
            <div className="mt-6 rounded-[12px] bg-[var(--subtle)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
              {t('wizard.summaryNotice')}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="quiet"
          onClick={() =>
            step === 0 ? router.push('/projects') : setStep((current) => current - 1)
          }
        >
          <ArrowLeft className="size-4" />{' '}
          {step === 0 ? t('wizard.cancel') : t('wizard.back')}
        </Button>
        {step < 3 ? (
          <Button size="lg" onClick={next}>
            {t('wizard.continue')} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={() => void create()} disabled={creating}>
            {creating ? t('wizard.creating') : t('wizard.create')}
            {!creating && <Check className="size-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}
