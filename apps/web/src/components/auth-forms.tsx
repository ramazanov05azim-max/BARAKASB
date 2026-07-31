'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from '@/i18n/i18n-provider';
import type { TranslationKey } from '@/i18n/config';
import { MockRepositoryError, mockRepository } from '@/lib/mock-repository';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

type Translator = (key: TranslationKey) => string;
type LoginValues = { email: string; password: string };
type RegisterValues = LoginValues & {
  name: string;
  confirmPassword: string;
  terms: boolean;
};
type ResetValues = { email: string };

function emailSchema(t: Translator) {
  return z.string().trim().email(t('validation.email'));
}

function passwordSchema(t: Translator) {
  return z.string().min(8, t('validation.passwordMin'));
}

function repositoryError(
  error: unknown,
  fallback: TranslationKey,
  t: Translator,
): string {
  if (error instanceof MockRepositoryError) {
    const errorKeys: Record<MockRepositoryError['code'], TranslationKey> = {
      'account-blocked': 'auth.errorBlocked',
      'account-existing': 'auth.errorExisting',
      'invalid-password': 'validation.passwordMin',
    };
    return t(errorKeys[error.code]);
  }
  return t(fallback);
}

export function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const loginSchema = z.object({
    email: emailSchema(t),
    password: passwordSchema(t),
  });
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setServerError('');
        try {
          await mockRepository.authenticate(values.email, values.password);
          router.push('/projects');
        } catch (error) {
          setServerError(repositoryError(error, 'auth.errorSignIn', t));
        }
      })}
    >
      <Field label={t('common.email')} error={form.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          {...form.register('email')}
        />
      </Field>
      <Field
        label={t('common.password')}
        error={form.formState.errors.password?.message}
        after={
          <Link className="text-xs font-semibold text-[var(--action)]" href="/recover">
            {t('auth.forgotPassword')}
          </Link>
        }
      >
        <Input
          type="password"
          autoComplete="current-password"
          {...form.register('password')}
        />
      </Field>
      {serverError && <FormError>{serverError}</FormError>}
      <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        {!form.formState.isSubmitting && <ArrowRight className="size-4" />}
      </Button>
      <p className="text-center text-xs leading-5 text-[var(--muted)]">
        {t('auth.prototypeHint')}
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const registerSchema = z
    .object({
      name: z.string().trim().min(2, t('validation.fullName')),
      email: emailSchema(t),
      password: passwordSchema(t),
      confirmPassword: z.string(),
      terms: z.boolean().refine((value) => value, t('validation.acceptTerms')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword'],
    });
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setServerError('');
        try {
          await mockRepository.register(values.name, values.email, values.password);
          router.push('/login?registered=1');
        } catch (error) {
          setServerError(repositoryError(error, 'auth.errorRegister', t));
        }
      })}
    >
      <Field label={t('common.fullName')} error={form.formState.errors.name?.message}>
        <Input
          autoComplete="name"
          placeholder={t('auth.namePlaceholder')}
          {...form.register('name')}
        />
      </Field>
      <Field label={t('common.email')} error={form.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          {...form.register('email')}
        />
      </Field>
      <Field
        label={t('common.password')}
        error={form.formState.errors.password?.message}
      >
        <Input
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
      </Field>
      <Field
        label={t('auth.confirmPassword')}
        error={form.formState.errors.confirmPassword?.message}
      >
        <Input
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
        />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-5 text-[var(--text-secondary)]">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--action)]"
          {...form.register('terms')}
        />
        <span>{t('auth.acceptTerms')}</span>
      </label>
      {form.formState.errors.terms?.message && (
        <p className="text-xs text-[var(--danger)]">
          {form.formState.errors.terms.message}
        </p>
      )}
      {serverError && <FormError>{serverError}</FormError>}
      <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? t('auth.creatingAccount')
          : t('auth.createAccount')}
        {!form.formState.isSubmitting && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const resetSchema = z.object({ email: emailSchema(t) });
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  if (sent) {
    return (
      <div className="glass-panel rounded-[20px] p-6">
        <CheckCircle2 className="size-7 text-emerald-600" />
        <h2 className="mt-5 text-lg font-semibold">{t('auth.checkInbox')}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {t('auth.recoverySent')}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex text-sm font-semibold text-[var(--action)]"
        >
          {t('auth.returnToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        await mockRepository.requestPasswordReset(values.email);
        setSent(true);
      })}
    >
      <Field label={t('common.email')} error={form.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          {...form.register('email')}
        />
      </Field>
      <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('auth.sending') : t('auth.sendRecovery')}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  after,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        {after}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[14px] border border-red-200/80 bg-red-50/85 px-4 py-3.5 text-sm text-red-800 shadow-[inset_0_1px_0_rgb(255_255_255_/_65%)] dark:bg-red-950 dark:text-red-200"
    >
      {children}
    </div>
  );
}
