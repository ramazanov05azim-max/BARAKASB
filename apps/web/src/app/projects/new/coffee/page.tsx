import { PlatformShell } from '@/components/platform-shell';
import { CoffeeOnboardingScreen } from '@/features/coffee-onboarding/coffee-onboarding-screen';

export default async function CreateCoffeeProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const query = await searchParams;
  return (
    <PlatformShell>
      <CoffeeOnboardingScreen defaultName={query.name ?? ''} />
    </PlatformShell>
  );
}
