import { PlatformShell } from '@/components/platform-shell';
import { SubscriptionsView } from '@/components/subscriptions-view';

export default async function ProjectSubscriptionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const nameKey =
    projectId === 'north-star' ? 'common.seedProjectName' : 'common.newProject';
  return (
    <PlatformShell project={{ id: projectId, nameKey }}>
      <SubscriptionsView projectNameKey={nameKey} />
    </PlatformShell>
  );
}
