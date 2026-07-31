'use client';

import { ProjectDashboard } from './project-dashboard';

export function ProjectEntry({ projectId }: { projectId: string }) {
  return <ProjectDashboard projectId={projectId} />;
}
