import { PlatformShell } from '@/components/platform-shell';
import { CoffeeManagerSetupScreen } from '@/features/manager-coffee-setup/coffee-manager-setup-screen';

export default async function CoffeeManagerSetupPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <PlatformShell project={{ id: projectId }}>
      <CoffeeManagerSetupScreen projectId={projectId} />
    </PlatformShell>
  );
}
