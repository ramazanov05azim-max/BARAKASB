'use client';

import { Check, Globe2, LockKeyhole, ServerCog } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/i18n/i18n-provider';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function PlatformSettingsView() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [notices, setNotices] = useState(true);

  return (
    <>
      <PageHeading
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.description')}
        action={
          <Badge tone="warning">
            <LockKeyhole className="mr-1 size-3" /> {t('settings.demoAccess')}
          </Badge>
        }
      />
      <div className="mb-6 rounded-[16px] border border-amber-200/80 bg-amber-50/85 p-4 text-sm leading-6 text-amber-900 shadow-[inset_0_1px_0_rgb(255_255_255_/_65%)] dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        {t('settings.notice')}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <ServerCog className="size-5 text-[var(--action)]" />
              <h2 className="font-semibold">{t('settings.environment')}</h2>
            </div>
            <dl className="mt-6 divide-y divide-[var(--border)]">
              <Row label={t('settings.environment')} value={t('settings.prototype')} />
              <Row label={t('settings.region')} value={t('settings.localMock')} />
              <Row label={t('settings.platformStatus')} value={t('settings.healthy')} />
              <Row
                label={t('settings.compatibilityLock')}
                value={t('settings.notConnected')}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Globe2 className="size-5 text-[var(--action)]" />
              <h2 className="font-semibold">{t('settings.operatorPreferences')}</h2>
            </div>
            <label className="mt-6 flex items-start justify-between gap-6 rounded-[16px] border border-[var(--border)] bg-[var(--subtle)] p-4">
              <span>
                <span className="block text-sm font-semibold">
                  {t('settings.operationalNotices')}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {t('settings.operationalNoticesHint')}
                </span>
              </span>
              <input
                type="checkbox"
                checked={notices}
                onChange={(event) => setNotices(event.target.checked)}
                className="mt-1 size-4 accent-[var(--action)]"
              />
            </label>
            <Button
              className="mt-6"
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              {saved ? (
                <>
                  <Check className="size-4" /> {t('common.saved')}
                </>
              ) : (
                t('settings.savePreferences')
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}
