import { PlatformShell } from '@/components/platform-shell';
import { ProjectWizard } from '@/components/project-wizard';

export default async function CreateProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; solution?: string }>;
}) {
  const query = await searchParams;
  const directCoffee = query.category === 'food' && query.solution === 'coffee';
  return (
    <PlatformShell>
      <ProjectWizard directCoffee={directCoffee} />
    </PlatformShell>
  );
}
