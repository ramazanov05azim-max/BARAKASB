'use client';

import { ArrowRight, Coffee, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  projectStatusLabelKeys,
  roleLabelKeys,
  solutionLabelKeys,
} from '@/i18n/entity-labels';
import { useTranslation } from '@/i18n/i18n-provider';
import { localCoffeeManagerSetupRepository } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import { mockRepository, type ProjectSummary } from '@/lib/mock-repository';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';

export function ProjectsView() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    void localCoffeeManagerSetupRepository
      .seedDevelopmentDemo()
      .catch(() => null)
      .then(() => mockRepository.listProjects())
      .then((items) => {
        if (active) setProjects(items);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      projects?.filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase()),
      ) ?? [],
    [projects, query],
  );

  return (
    <>
      <PageHeading
        eyebrow={t('common.account')}
        title={t('projects.title')}
        description={t('projects.description')}
        action={
          <Link
            href="/projects/new?category=food&solution=coffee"
            className={buttonVariants({ size: 'lg' })}
          >
            <Plus className="size-4" /> {t('projects.createCoffee')}
          </Link>
        }
      />
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-10"
          placeholder={t('projects.searchPlaceholder')}
          aria-label={t('projects.searchLabel')}
        />
      </div>

      {!projects ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="skeleton h-56 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="max-w-xl">
          <CardContent className="py-12 text-center">
            <Coffee className="mx-auto size-7 text-[var(--action)]" />
            <h2 className="mt-5 text-xl font-semibold">
              {query ? t('projects.noMatches') : t('projects.firstProject')}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {query
                ? t('projects.noMatchesDescription')
                : t('projects.firstDescription')}
            </p>
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="mt-5 text-sm font-semibold text-[var(--action)]"
              >
                {t('projects.clearSearch')}
              </button>
            ) : (
              <Link
                href="/projects/new?category=food&solution=coffee"
                className={`${buttonVariants()} mt-6`}
              >
                {t('projects.createCoffee')}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              <Card className="h-full transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--border-strong)] group-hover:shadow-[var(--shadow-float)]">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <span className="soft-icon-tile grid size-12 place-items-center rounded-[16px]">
                      <Coffee className="size-5" />
                    </span>
                    <Badge tone={project.status === 'active' ? 'success' : 'warning'}>
                      {t(projectStatusLabelKeys[project.status])}
                    </Badge>
                  </div>
                  <h2 className="mt-8 text-xl font-semibold tracking-[-0.025em]">
                    {project.name}
                  </h2>
                  {project.isDevelopmentDemo && (
                    <Badge className="mt-2">{t('projects.developmentDemo')}</Badge>
                  )}
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {t(solutionLabelKeys[project.solutionId])} ·{' '}
                    {t(roleLabelKeys[project.role])}
                  </p>
                  <div className="mt-7 flex items-center text-sm font-semibold text-[var(--action)]">
                    {t('projects.open')}{' '}
                    <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
