import { PlatformShell } from '@/components/platform-shell';
import { CoffeeTechnicalSettingsScreen } from '@/features/manager-coffee-setup/coffee-technical-settings-screen';

export default async function CoffeeTechnicalSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <PlatformShell project={{ id: projectId }}>
      <CoffeeTechnicalSettingsScreen projectId={projectId} />
    </PlatformShell>
  );
}
