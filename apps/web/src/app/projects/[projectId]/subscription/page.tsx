import { redirect } from 'next/navigation';

export default async function ProjectSubscriptionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/admin/subscription`);
}
