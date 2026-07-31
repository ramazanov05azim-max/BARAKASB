import { notFound } from 'next/navigation';
import { PlatformShell } from '@/components/platform-shell';
import { CoffeeCrashTestScreen } from '@/features/manager-coffee-setup/coffee-crash-test-screen';

export default function CoffeeCrashTestBootstrapPage() {
  const enabled =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_COFFEE_CRASH_TEST === 'true';
  if (!enabled) notFound();

  return (
    <PlatformShell>
      <CoffeeCrashTestScreen />
    </PlatformShell>
  );
}
