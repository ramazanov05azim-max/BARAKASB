'use client';

import { CoffeeProjectEnvironment } from '@barakasb/solution-coffee';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/i18n/i18n-provider';
import { mockRepository, type ProjectSummary } from '@/lib/mock-repository';
import { buttonVariants } from './ui/button';
import { Card, CardContent } from './ui/card';

export function CoffeeProjectBridge({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const { t, locale } = useTranslation();
  const [project, setProject] = useState<ProjectSummary | null | undefined>(undefined);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    void Promise.all([
      mockRepository.getProject(projectId),
      mockRepository.listProjects(),
    ]).then(([currentProject, availableProjects]) => {
      setProject(currentProject);
      setProjects(availableProjects);
    });
  }, [projectId]);

  if (project === undefined) {
    return (
      <div className="min-h-dvh bg-transparent p-5 sm:p-8">
        <div className="skeleton mx-auto h-96 max-w-5xl rounded-[16px]" />
      </div>
    );
  }

  if (!project || project.solutionId !== 'coffee') {
    return (
      <div className="grid min-h-dvh place-items-center bg-transparent p-5">
        <Card className="max-w-lg">
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
      </div>
    );
  }

  return (
    <CoffeeProjectEnvironment
      key={project.id}
      projectId={project.id}
      projectName={project.displayName ?? project.name}
      locale={locale}
      projects={projects
        .filter((availableProject) => availableProject.solutionId === 'coffee')
        .map((availableProject) => ({
          id: availableProject.id,
          name: availableProject.displayName ?? availableProject.name,
          ...(availableProject.developmentLabel
            ? { developmentLabel: availableProject.developmentLabel }
            : {}),
        }))}
      languageControl={<LanguageSwitcher compact />}
    >
      {children}
    </CoffeeProjectEnvironment>
  );
}
