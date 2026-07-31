import { CoffeeProjectBridge } from '@/components/coffee-project-bridge';

export default async function CoffeeLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const { projectId } = await params;
  return <CoffeeProjectBridge projectId={projectId}>{children}</CoffeeProjectBridge>;
}
