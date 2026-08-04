import { notFound } from 'next/navigation';
import { PlatformShell } from '@/components/platform-shell';
import { CoffeeCrashTestScreen } from '@/features/manager-coffee-setup/coffee-crash-test-screen';

export function isCoffeeCrashTestRouteEnabled(environment: string | undefined) {
  return environment === 'development';
}

export function CoffeeCrashTestBootstrapContent() {
  return (
    <PlatformShell>
      <CoffeeCrashTestScreen />
    </PlatformShell>
  );
}

export default function CoffeeCrashTestBootstrapPage() {
  if (!isCoffeeCrashTestRouteEnabled(process.env.NODE_ENV)) notFound();

  return <CoffeeCrashTestBootstrapContent />;
}
