import { PlatformShell } from '@/components/platform-shell';
import { SolutionConstructorScreen } from '@/features/solution-constructor/solution-constructor-screen';

export default async function SolutionConstructorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <PlatformShell project={{ id: projectId }}>
      <SolutionConstructorScreen projectId={projectId} />
    </PlatformShell>
  );
}
