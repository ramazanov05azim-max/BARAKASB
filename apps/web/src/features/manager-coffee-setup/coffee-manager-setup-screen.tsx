'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeEstablishmentInput,
  type CoffeeManagerSetupRepository,
} from './coffee-manager-setup-repository';

const selectClassName =
  'h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[15px] text-[var(--text)] shadow-[inset_0_1px_0_rgb(255_255_255_/_70%),0_8px_20px_rgb(39_70_120_/_4%)] outline-none transition focus:border-[var(--action)] focus:bg-[var(--surface-solid)] focus:ring-4 focus:ring-[var(--focus-soft)]';

type FormValues = CoffeeEstablishmentInput;

export function CoffeeManagerSetupScreen({
  projectId,
  repository = localCoffeeManagerSetupRepository,
}: {
  projectId: string;
  repository?: CoffeeManagerSetupRepository;
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const schema = useMemo(
    () =>
      z.object({
        establishmentName: z
          .string()
          .trim()
          .min(2, t('coffeeOnboarding.validation.establishmentName'))
          .max(80, t('coffeeOnboarding.validation.maxLength')),
        legalName: z
          .string()
          .trim()
          .max(120, t('coffeeOnboarding.validation.maxLength')),
        ownerName: z
          .string()
          .trim()
          .min(2, t('coffeeOnboarding.validation.ownerName'))
          .max(100, t('coffeeOnboarding.validation.maxLength')),
        country: z.string().trim().min(2, t('coffeeOnboarding.validation.required')),
        city: z
          .string()
          .trim()
          .min(2, t('coffeeOnboarding.validation.city'))
          .max(80, t('coffeeOnboarding.validation.maxLength')),
        address: z
          .string()
          .trim()
          .min(5, t('coffeeOnboarding.validation.address'))
          .max(180, t('coffeeOnboarding.validation.maxLength')),
        timezone: z.string().trim().min(1, t('coffeeOnboarding.validation.required')),
        currency: z
          .string()
          .trim()
          .length(3, t('coffeeOnboarding.validation.required')),
        language: z.enum(['ru', 'en']),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9 ()-]{7,24}$/, t('coffeeOnboarding.validation.phone')),
        email: z.string().trim().email(t('validation.email')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      establishmentName: '',
      legalName: '',
      ownerName: '',
      country: 'RU',
      city: '',
      address: '',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      language: locale,
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    let active = true;
    void repository
      .get(projectId)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setError('root', { message: t('coffeeOnboarding.notInstalled') });
          return;
        }
        if (record.establishment) reset(record.establishment);
        else
          reset((current) => ({ ...current, establishmentName: record.project.name }));
      })
      .catch(() => {
        if (active) {
          setError('root', { message: t('coffeeOnboarding.errorLoad') });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, repository, reset, setError, t]);

  async function submit(values: FormValues): Promise<void> {
    try {
      await repository.configure(projectId, values);
      router.push(`/projects/${projectId}`);
    } catch {
      setError('root', { message: t('coffeeOnboarding.errorCreate') });
    }
  }

  if (loading) {
    return (
      <div className="space-y-5" aria-label={t('common.loading')}>
        <div className="skeleton h-28 max-w-2xl rounded-[16px]" />
        <div className="skeleton h-96 rounded-[16px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <span className="soft-icon-tile grid size-14 place-items-center rounded-[18px]">
          <Coffee className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
          {t('coffeeOnboarding.managerEyebrow')}
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          {t('coffeeOnboarding.managerTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[var(--text-secondary)]">
          {t('coffeeOnboarding.managerDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <Card>
          <CardContent className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <Field
              id="establishmentName"
              label={t('coffeeOnboarding.establishmentName')}
              error={errors.establishmentName?.message}
            >
              <Input
                id="establishmentName"
                autoFocus
                placeholder={t('coffeeOnboarding.establishmentNamePlaceholder')}
                aria-invalid={Boolean(errors.establishmentName)}
                {...register('establishmentName')}
              />
            </Field>
            <Field
              id="legalName"
              label={t('coffeeOnboarding.legalName')}
              optional={t('common.optional')}
              error={errors.legalName?.message}
            >
              <Input
                id="legalName"
                placeholder={t('coffeeOnboarding.legalNamePlaceholder')}
                aria-invalid={Boolean(errors.legalName)}
                {...register('legalName')}
              />
            </Field>
            <Field
              id="ownerName"
              label={t('coffeeOnboarding.ownerName')}
              error={errors.ownerName?.message}
            >
              <Input
                id="ownerName"
                autoComplete="name"
                placeholder={t('coffeeOnboarding.ownerNamePlaceholder')}
                aria-invalid={Boolean(errors.ownerName)}
                {...register('ownerName')}
              />
            </Field>
            <Field
              id="country"
              label={t('coffeeOnboarding.country')}
              error={errors.country?.message}
            >
              <select
                id="country"
                className={selectClassName}
                aria-invalid={Boolean(errors.country)}
                {...register('country')}
              >
                <option value="RU">{t('coffeeOnboarding.countryRussia')}</option>
                <option value="AZ">{t('coffeeOnboarding.countryAzerbaijan')}</option>
                <option value="KZ">{t('coffeeOnboarding.countryKazakhstan')}</option>
                <option value="US">{t('coffeeOnboarding.countryUnitedStates')}</option>
              </select>
            </Field>
            <Field
              id="city"
              label={t('coffeeOnboarding.city')}
              error={errors.city?.message}
            >
              <Input
                id="city"
                autoComplete="address-level2"
                placeholder={t('coffeeOnboarding.cityPlaceholder')}
                aria-invalid={Boolean(errors.city)}
                {...register('city')}
              />
            </Field>
            <Field
              id="address"
              label={t('coffeeOnboarding.address')}
              error={errors.address?.message}
            >
              <Input
                id="address"
                autoComplete="street-address"
                placeholder={t('coffeeOnboarding.addressPlaceholder')}
                aria-invalid={Boolean(errors.address)}
                {...register('address')}
              />
            </Field>
            <Field
              id="timezone"
              label={t('coffeeOnboarding.timezone')}
              error={errors.timezone?.message}
            >
              <select
                id="timezone"
                className={selectClassName}
                aria-invalid={Boolean(errors.timezone)}
                {...register('timezone')}
              >
                <option value="Europe/Moscow">Europe/Moscow</option>
                <option value="Asia/Baku">Asia/Baku</option>
                <option value="Asia/Almaty">Asia/Almaty</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            <Field
              id="currency"
              label={t('coffeeOnboarding.currency')}
              error={errors.currency?.message}
            >
              <select
                id="currency"
                className={selectClassName}
                aria-invalid={Boolean(errors.currency)}
                {...register('currency')}
              >
                <option value="RUB">{t('coffeeOnboarding.currencyRub')}</option>
                <option value="AZN">{t('coffeeOnboarding.currencyAzn')}</option>
                <option value="KZT">{t('coffeeOnboarding.currencyKzt')}</option>
                <option value="USD">{t('coffeeOnboarding.currencyUsd')}</option>
              </select>
            </Field>
            <Field
              id="language"
              label={t('coffeeOnboarding.language')}
              error={errors.language?.message}
            >
              <select
                id="language"
                className={selectClassName}
                aria-invalid={Boolean(errors.language)}
                {...register('language')}
              >
                <option value="ru">{t('language.russian')}</option>
                <option value="en">{t('language.english')}</option>
              </select>
            </Field>
            <Field
              id="phone"
              label={t('coffeeOnboarding.phone')}
              error={errors.phone?.message}
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t('coffeeOnboarding.phonePlaceholder')}
                aria-invalid={Boolean(errors.phone)}
                {...register('phone')}
              />
            </Field>
            <Field
              id="email"
              label={t('coffeeOnboarding.email')}
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>
          </CardContent>
        </Card>

        {errors.root?.message && (
          <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
            {errors.root.message}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <Link
            href={`/projects/${projectId}`}
            className={buttonVariants({ variant: 'quiet', size: 'lg' })}
          >
            <ArrowLeft className="size-4" />
            {t('wizard.cancel')}
          </Link>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {t(isSubmitting ? 'coffeeOnboarding.saving' : 'coffeeOnboarding.save')}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {optional && <span className="text-xs text-[var(--muted)]">{optional}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
