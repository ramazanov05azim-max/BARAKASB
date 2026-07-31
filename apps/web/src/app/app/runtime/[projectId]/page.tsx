import { OperationalRuntimeScreen } from '@/features/universal-application/presentation/operational-runtime-screen';

export default async function OperationalRuntimePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <OperationalRuntimeScreen projectId={projectId} />;
}
