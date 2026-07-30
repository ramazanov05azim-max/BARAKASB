'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { RegisterForm } from '@/components/auth-forms';
import { useTranslation } from '@/i18n/i18n-provider';

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      description={t('auth.registerDescription')}
      footer={
        <>
          {t('auth.alreadyAccount')}{' '}
          <Link href="/login" className="font-semibold text-[var(--action)]">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
