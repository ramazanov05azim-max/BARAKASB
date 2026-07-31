'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { mockRepository } from '@/lib/mock-repository';

export function ProjectEntry({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    void mockRepository.getProject(projectId).then((project) => {
      router.replace(
        project?.solutionId === 'coffee'
          ? `/projects/${projectId}/coffee`
          : '/projects',
      );
    });
  }, [projectId, router]);

  return (
    <div className="space-y-5">
      <div className="skeleton h-28 max-w-2xl rounded-[16px]" />
      <div className="skeleton h-72 rounded-[16px]" />
    </div>
  );
}
