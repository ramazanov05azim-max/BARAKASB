'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import { coffeeCrashTestProjectId } from './coffee-manager-setup-repository';
import {
  localCoffeeCrashTestService,
  type CoffeeCrashTestService,
} from './coffee-crash-test-service';

export function CoffeeCrashTestRefreshAction({
  service = localCoffeeCrashTestService,
  development = process.env.NODE_ENV === 'development',
}: {
  service?: CoffeeCrashTestService;
  development?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!development) return null;

  async function refreshEnvironment(): Promise<void> {
    if (!window.confirm(t('crashTest.destructiveWarning'))) return;
    setWorking(true);
    setFailed(false);
    try {
      await service.resetAndInstall();
      router.push(`/projects/${coffeeCrashTestProjectId}?crashTestInstalled=1`);
    } catch {
      setFailed(true);
      setWorking(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={working}
        onClick={() => void refreshEnvironment()}
      >
        <RefreshCw className={`size-4 ${working ? 'animate-spin' : ''}`} />
        {t('crashTest.updateEnvironment')}
      </Button>
      {failed && (
        <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
          {t('crashTest.error')}
        </p>
      )}
    </div>
  );
}
