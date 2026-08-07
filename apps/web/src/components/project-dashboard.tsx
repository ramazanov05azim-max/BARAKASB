'use client';

import {
  ArrowRight,
  Check,
  Clock3,
  Coffee,
  LayoutGrid,
  Layers3,
  Menu,
  Settings2,
  Store,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CoffeeSolutionModuleId } from '@barakasb/solution-coffee';
import { roleLabelKeys, solutionLabelKeys } from '@/i18n/entity-labels';
import type { TranslationKey } from '@/i18n/config';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  mockRepository,
  type MockRepository,
  type ProjectSummary,
} from '@/lib/mock-repository';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRecord,
  type CoffeeManagerSetupRepository,
} from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import {
  localSolutionConstructorService,
  type SolutionConstructorService,
  type SolutionConstructorState,
} from '@/features/solution-constructor/solution-constructor-service';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/button';
import { Card, CardContent } from './ui/card';

const moduleKeys: Record<CoffeeSolutionModuleId, TranslationKey> = {
  bar: 'constructor.module.bar',
  kitchen: 'constructor.module.kitchen',
  warehouse: 'constructor.module.warehouse',
  purchasing: 'constructor.module.purchasing',
  manager: 'constructor.module.manager',
  delivery: 'constructor.module.delivery',
  production: 'constructor.module.production',
  pickup: 'constructor.module.pickup',
};

export function ProjectDashboard({
  projectId,
  projectRepository = mockRepository,
  setupRepository = localCoffeeManagerSetupRepository,
  constructorService = localSolutionConstructorService,
}: {
  projectId: string;
  projectRepository?: Pick<MockRepository, 'getProject'>;
  setupRepository?: Pick<CoffeeManagerSetupRepository, 'get'>;
  constructorService?: Pick<SolutionConstructorService, 'load'>;
}) {
  const { t } = useTranslation();
  const [project, setProject] = useState<ProjectSummary | null | undefined>(undefined);
  const [setup, setSetup] = useState<CoffeeManagerSetupRecord | null>(null);
  const [constructor, setConstructor] = useState<SolutionConstructorState | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      projectRepository.getProject(projectId),
      setupRepository.get(projectId),
    ]).then(async ([currentProject, currentSetup]) => {
      if (!active) return;
      setProject(currentProject);
      setSetup(currentSetup);
      if (currentSetup?.businessEnvironmentId && currentSetup.businessEnvironmentCode) {
        try {
          const state = await constructorService.load(projectId);
          if (active) setConstructor(state);
        } catch {
          if (active) setConstructor(null);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [constructorService, projectId, projectRepository, setupRepository]);

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

  const isConfigured = Boolean(setup?.establishment);
  const workspaces = constructor?.structure.workspaces ?? [];

  return (
    <>
      <PageHeading
        eyebrow={`${t(solutionLabelKeys[project.solutionId])} · ${t(roleLabelKeys[project.role])}`}
        title={project.displayName ?? project.name}
        description={t('ownerOverview.description')}
        action={
          <Badge tone={isConfigured ? 'success' : 'warning'}>
            {isConfigured && <Check className="mr-1 size-3.5" />}
            {t(
              isConfigured ? 'ownerOverview.configured' : 'ownerOverview.setupRequired',
            )}
          </Badge>
        }
      />

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="soft-icon-tile grid size-12 shrink-0 place-items-center rounded-[16px]">
              <Settings2 className="size-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                {t('ownerOverview.configurationTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                {t('ownerOverview.configurationDescription')}
              </p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ConfigurationLink
              href={`/projects/${project.id}/admin/solutions/coffee/setup`}
              icon={Store}
              label={t('ownerOverview.configureEstablishment')}
            />
            <ConfigurationLink
              href={`/projects/${project.id}/admin/solutions/coffee/constructor`}
              icon={Layers3}
              label={t('ownerOverview.buildWorkspaces')}
              disabled={!setup?.businessEnvironmentId}
            />
            <ConfigurationLink
              href={`/projects/${project.id}/admin/solutions/coffee/constructor#employees`}
              icon={Users}
              label={t('ownerOverview.employees')}
              disabled={!setup?.businessEnvironmentId}
            />
            <ConfigurationLink
              href={`/projects/${project.id}/coffee/menu/items`}
              icon={Menu}
              label={t('ownerOverview.menu')}
            />
            <ConfigurationLink
              href={`/projects/${project.id}/coffee/floor-plan`}
              icon={LayoutGrid}
              label={t('ownerOverview.floorPlan')}
            />
            <ConfigurationLink
              href={`/projects/${project.id}/coffee/setup/business-profile`}
              icon={Clock3}
              label={t('ownerOverview.hours')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--action)]">
                {t('ownerOverview.solutionEyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {t('ownerOverview.workspacesTitle')}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {t('ownerOverview.workspacesDescription')}
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/admin/solutions/coffee/constructor`}
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              {t('ownerOverview.configure')}
            </Link>
          </div>

          {workspaces.length === 0 ? (
            <div className="mt-6 rounded-[20px] border border-dashed border-[var(--border-strong)] p-8 text-center">
              <Coffee className="mx-auto size-7 text-[var(--action)]" />
              <p className="mt-4 font-semibold">{t('ownerOverview.noWorkspaces')}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                {t('ownerOverview.noWorkspacesDescription')}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {workspaces.map((workspace) => {
                const connected = constructor?.connectedWorkspaceId === workspace.id;
                return (
                  <article
                    key={workspace.id}
                    className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {t(moduleKeys[workspace.moduleId])}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone="success">{t('common.active')}</Badge>
                          <Badge>
                            {t('ownerOverview.employeeCount').replace(
                              '{count}',
                              String(workspace.assignedEmployeeIds.length),
                            )}
                          </Badge>
                        </div>
                      </div>
                      <span className="soft-icon-tile grid size-11 place-items-center rounded-[14px]">
                        <Coffee className="size-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-[var(--text-secondary)]">
                      {t(
                        connected
                          ? 'ownerOverview.deviceConnected'
                          : 'ownerOverview.deviceNotConnected',
                      )}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/projects/${project.id}/admin/solutions/coffee/workspaces/${workspace.id}/open`}
                        className={buttonVariants({ size: 'sm' })}
                      >
                        {t('ownerOverview.open')}
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href={`/projects/${project.id}/admin/solutions/coffee/constructor`}
                        className={buttonVariants({
                          variant: 'secondary',
                          size: 'sm',
                        })}
                      >
                        {t('ownerOverview.configure')}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Link
          href={`/projects/${project.id}/admin/solutions/coffee/settings/advanced`}
          className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]"
        >
          {t('ownerOverview.technicalSettings')}
        </Link>
      </div>
    </>
  );
}

function ConfigurationLink({
  href,
  icon: Icon,
  label,
  disabled = false,
}: {
  href: string;
  icon: typeof Coffee;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex min-h-16 items-center gap-3 rounded-[17px] border border-[var(--border)] bg-[var(--subtle)] px-4 text-sm font-semibold text-[var(--muted)] opacity-60"
      >
        <Icon className="size-4" />
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-[17px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-semibold transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]"
    >
      <Icon className="size-4 text-[var(--action)]" />
      {label}
      <ArrowRight className="ml-auto size-4 text-[var(--muted)]" />
    </Link>
  );
}
