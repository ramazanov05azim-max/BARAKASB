'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { ForgotPasswordForm } from '@/components/auth-forms';
import { useTranslation } from '@/i18n/i18n-provider';

export default function RecoverPage() {
  const { t } = useTranslation();

  return (
    <AuthShell
      title={t('auth.recoverTitle')}
      description={t('auth.recoverDescription')}
      footer={
        <Link href="/login" className="font-semibold text-[var(--action)]">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
