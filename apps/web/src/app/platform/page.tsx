import { PlatformSettingsView } from '@/components/platform-settings-view';
import { PlatformShell } from '@/components/platform-shell';

export default function PlatformPage() {
  return (
    <PlatformShell>
      <PlatformSettingsView />
    </PlatformShell>
  );
}
