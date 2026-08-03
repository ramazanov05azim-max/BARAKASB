'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  LocalApplicationBootstrapController,
  type ApplicationBootstrapController,
  type ApplicationBootstrapSnapshot,
} from '../application/bootstrap';
import { universalApplicationRoutes } from '../routes';
import type { OperationalWorkspaceSessionStore } from '../application/workspace-access';
import { localOperationalWorkspaceSession } from '../infrastructure/local-operational-workspace-session';

export function UniversalBootstrapRoute({
  workspaceSession = localOperationalWorkspaceSession,
}: {
  workspaceSession?: OperationalWorkspaceSessionStore;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [controller] = useState<ApplicationBootstrapController>(
    () => new LocalApplicationBootstrapController(),
  );
  const [snapshot, setSnapshot] = useState<ApplicationBootstrapSnapshot>(() =>
    controller.getSnapshot(),
  );

  useEffect(() => {
    let active = true;
    const connected = workspaceSession.readConnected();
    if (connected) {
      router.replace(
        `/app/runtime/${connected.workspace.projectId}/workspaces/${connected.workspace.workspaceId}`,
      );
      return () => {
        active = false;
      };
    }

    void controller.start().then(() => {
      if (!active) return;
      const nextSnapshot = controller.getSnapshot();
      setSnapshot(nextSnapshot);

      if (nextSnapshot.state === 'requires-environment-code') {
        router.replace(universalApplicationRoutes.connect);
      }
    });

    return () => {
      active = false;
    };
  }, [controller, router, workspaceSession]);

  return (
    <section className="text-center" aria-live="polite">
      <LoaderCircle
        className="mx-auto size-7 animate-spin text-[var(--action)] motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h1 className="mt-5 text-xl font-semibold">{t('universal.starting')}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t(
          snapshot.state === 'starting'
            ? 'universal.startingDescription'
            : 'universal.redirecting',
        )}
      </p>
    </section>
  );
}
