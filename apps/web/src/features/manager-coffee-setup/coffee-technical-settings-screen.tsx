'use client';

import { ArrowLeft, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/i18n-provider';
import { formatBusinessEnvironmentCode } from './business-environment-code';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRecord,
  type CoffeeManagerSetupRepository,
} from './coffee-manager-setup-repository';

export function CoffeeTechnicalSettingsScreen({
  projectId,
  repository = localCoffeeManagerSetupRepository,
}: {
  projectId: string;
  repository?: Pick<CoffeeManagerSetupRepository, 'get'>;
}) {
  const { t } = useTranslation();
  const [record, setRecord] = useState<CoffeeManagerSetupRecord | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    void repository.get(projectId).then((value) => {
      if (active) setRecord(value);
    });
    return () => {
      active = false;
    };
  }, [projectId, repository]);

  if (record === undefined) {
    return <div className="skeleton h-72 rounded-[20px]" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"
      >
        <ArrowLeft className="size-4" />
        {t('technicalSettings.back')}
      </Link>
      <div className="mt-7">
        <span className="soft-icon-tile grid size-14 place-items-center rounded-[18px]">
          <LockKeyhole className="size-6" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--action)]">
          {t('technicalSettings.eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
          {t('technicalSettings.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {t('technicalSettings.description')}
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6 sm:p-8">
          <Label htmlFor="business-environment-id">
            {t('technicalSettings.internalIdentifier')}
          </Label>
          <Input
            id="business-environment-id"
            className="mt-2 font-mono tracking-[0.08em]"
            value={
              record?.businessEnvironmentCode
                ? formatBusinessEnvironmentCode(record.businessEnvironmentCode)
                : t('technicalSettings.notConfigured')
            }
            readOnly
          />
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {t('technicalSettings.identifierExplanation')}
          </p>
        </CardContent>
      </Card>

      <Link
        href={`/projects/${projectId}`}
        className={`${buttonVariants({ variant: 'secondary' })} mt-6`}
      >
        {t('technicalSettings.back')}
      </Link>
    </div>
  );
}
