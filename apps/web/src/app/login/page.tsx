'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/auth-forms';
import { useTranslation } from '@/i18n/i18n-provider';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      description={t('auth.loginDescription')}
      footer={
        <>
          {t('auth.newUser')}{' '}
          <Link href="/register" className="font-semibold text-[var(--action)]">
            {t('auth.createAccount')}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
