import { OperationalWorkspaceScreen } from '@/features/universal-application/presentation/operational-workspace-screen';

export default async function OperationalWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string; workspaceId: string }>;
}) {
  const { projectId, workspaceId } = await params;
  return <OperationalWorkspaceScreen projectId={projectId} workspaceId={workspaceId} />;
}
