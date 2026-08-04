'use client';

import { ArrowLeft, Coffee, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CoffeeBarWorkspaceScreen } from '@barakasb/solution-coffee';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TranslationKey } from '@/i18n/config';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  localOwnerWorkspacePreviewService,
  OwnerWorkspacePreviewError,
  type OwnerWorkspacePreviewContext,
  type OwnerWorkspacePreviewService,
} from './owner-workspace-preview-service';

const moduleKeys = {
  bar: 'constructor.module.bar',
  kitchen: 'constructor.module.kitchen',
  warehouse: 'constructor.module.warehouse',
  manager: 'constructor.module.manager',
  delivery: 'constructor.module.delivery',
  production: 'constructor.module.production',
  pickup: 'constructor.module.pickup',
} satisfies Record<OwnerWorkspacePreviewContext['workspaceType'], TranslationKey>;

export function OwnerWorkspacePreviewScreen({
  projectId,
  workspaceId,
  service = localOwnerWorkspacePreviewService,
}: {
  projectId: string;
  workspaceId: string;
  service?: OwnerWorkspacePreviewService;
}) {
  const { t } = useTranslation();
  const [context, setContext] = useState<OwnerWorkspacePreviewContext | null>(null);
  const [error, setError] = useState<'inactive' | 'unavailable' | null>(null);

  useEffect(() => {
    let active = true;
    void service
      .load(projectId, workspaceId)
      .then((value) => {
        if (active) setContext(value);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof OwnerWorkspacePreviewError &&
            cause.code === 'workspace-inactive'
            ? 'inactive'
            : 'unavailable',
        );
      });
    return () => {
      active = false;
    };
  }, [projectId, service, workspaceId]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <h1 className="text-2xl font-semibold">
            {t(
              error === 'inactive'
                ? 'ownerPreview.inactiveTitle'
                : 'ownerPreview.unavailableTitle',
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--text-secondary)]">
            {t(
              error === 'inactive'
                ? 'ownerPreview.inactiveDescription'
                : 'ownerPreview.unavailableDescription',
            )}
          </p>
          <Link href={`/projects/${projectId}`} className={`${buttonVariants()} mt-7`}>
            {t('ownerPreview.return')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return (
      <div className="space-y-5" aria-label={t('common.loading')}>
        <div className="skeleton h-24 rounded-[20px]" />
        <div className="skeleton h-96 rounded-[20px]" />
      </div>
    );
  }

  const workspaceName = t(moduleKeys[context.workspaceType]);

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-[20px] border border-blue-200/70 bg-[var(--action-soft)] p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[var(--action)]">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{t('ownerPreview.title')}</p>
              <Badge>{workspaceName}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t('ownerPreview.description').replace('{project}', context.projectName)}
            </p>
          </div>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          <ArrowLeft className="size-4" />
          {t('ownerPreview.return')}
        </Link>
      </div>

      {context.workspaceType === 'bar' ? (
        <CoffeeBarWorkspaceScreen
          context={{
            projectId: context.projectId,
            businessEnvironmentId: context.businessEnvironmentId,
            workspaceId: context.workspaceId,
            employeeId: 'owner-preview',
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="soft-icon-tile mx-auto grid size-14 place-items-center rounded-[18px]">
              <Coffee className="size-6" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold">{workspaceName}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-secondary)]">
              {t('ownerPreview.placeholder')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
