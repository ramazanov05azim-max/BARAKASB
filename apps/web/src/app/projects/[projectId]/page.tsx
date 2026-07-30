import { PlatformShell } from '@/components/platform-shell';
import { ProjectDashboard } from '@/components/project-dashboard';

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
      <ProjectDashboard projectId={projectId} />
    </PlatformShell>
  );
}
