import { ConnectionScreen } from '@/features/universal-application/presentation/connection-screen';

export default async function UniversalApplicationConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const query = await searchParams;
  return <ConnectionScreen initialCode={query.code ?? ''} />;
}
