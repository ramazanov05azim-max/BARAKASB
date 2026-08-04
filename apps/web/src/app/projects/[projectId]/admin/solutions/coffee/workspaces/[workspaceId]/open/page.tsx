import { PlatformShell } from '@/components/platform-shell';
import { OwnerWorkspacePreviewScreen } from '@/features/owner-workspace-preview/owner-workspace-preview-screen';

export default async function OwnerWorkspacePreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; workspaceId: string }>;
}) {
  const { projectId, workspaceId } = await params;
  return (
    <PlatformShell project={{ id: projectId }}>
      <OwnerWorkspacePreviewScreen projectId={projectId} workspaceId={workspaceId} />
    </PlatformShell>
  );
}
