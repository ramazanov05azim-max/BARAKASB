import { PlatformShell } from '@/components/platform-shell';
import { ProjectEntry } from '@/components/project-entry';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <PlatformShell
      project={{
        id: projectId,
        nameKey:
          projectId === 'north-star' ? 'common.seedProjectName' : 'common.newProject',
      }}
    >
      <ProjectEntry projectId={projectId} />
    </PlatformShell>
  );
}
