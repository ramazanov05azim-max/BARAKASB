'use client';

import { ArrowRight, Check, Coffee, Settings2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { roleLabelKeys, solutionLabelKeys } from '@/i18n/entity-labels';
import { useTranslation } from '@/i18n/i18n-provider';
import { mockRepository, type ProjectSummary } from '@/lib/mock-repository';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/button';
import { Card, CardContent } from './ui/card';

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [project, setProject] = useState<ProjectSummary | null | undefined>(undefined);

  useEffect(() => {
    void mockRepository.getProject(projectId).then(setProject);
  }, [projectId]);

  if (project === undefined) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-28 max-w-2xl rounded-[16px]" />
        <div className="skeleton h-72 rounded-[16px]" />
      </div>
    );
  }

  if (project === null) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <h1 className="text-2xl font-semibold">{t('dashboard.notFound')}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t('dashboard.notFoundDescription')}
          </p>
          <Link href="/projects" className={`${buttonVariants()} mt-6`}>
            {t('dashboard.returnProjects')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow={`${t(solutionLabelKeys[project.solutionId])} · ${t(roleLabelKeys[project.role])}`}
        title={project.name}
        description={t('dashboard.description')}
        action={
          <Badge tone="success">
            <Check className="mr-1 size-3.5" /> {t('common.active')}
          </Badge>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardContent className="p-7 sm:p-8">
            <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
              <Coffee className="size-5" />
            </span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">
              {t('dashboard.beginTitle')}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              {t('dashboard.beginDescription')}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/profile"
                className={buttonVariants({ variant: 'secondary' })}
              >
                <UserPlus className="size-4" /> {t('dashboard.reviewProfile')}
              </Link>
              <Link
                href={`/projects/${project.id}/admin/subscription`}
                className={buttonVariants({ variant: 'secondary' })}
              >
                <Settings2 className="size-4" /> {t('dashboard.reviewSubscription')}
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="font-semibold">{t('dashboard.setup')}</h2>
            <div className="mt-5 space-y-5">
              <SetupItem
                done
                title={t('dashboard.created')}
                detail={t('dashboard.workspaceReady')}
              />
              <SetupItem
                done
                title={t('dashboard.solutionSelected')}
                detail={t('common.coffee')}
              />
              <SetupItem
                title={t('dashboard.businessSetup')}
                detail={t('dashboard.laterPhase')}
              />
            </div>
            <Link
              href="/solutions"
              className="mt-8 flex items-center text-sm font-semibold text-[var(--action)]"
            >
              {t('dashboard.exploreSolutions')}{' '}
              <ArrowRight className="ml-auto size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SetupItem({
  done = false,
  title,
  detail,
}: {
  done?: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 grid size-5 place-items-center rounded-full ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'border border-[var(--border)] text-[var(--muted)]'}`}
      >
        {done ? (
          <Check className="size-3" />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  );
}
