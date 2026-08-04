'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n/i18n-provider';
import type {
  OperationalWorkspaceAccessResolver,
  OperationalWorkspaceSessionStore,
} from '../application/workspace-access';
import { migrateLegacyOperationalStorage } from '../infrastructure/local-operational-storage-migration';
import { localOperationalWorkspaceResolver } from '../infrastructure/local-operational-workspace-directory';
import { localOperationalWorkspaceSession } from '../infrastructure/local-operational-workspace-session';
import { universalApplicationRoutes } from '../routes';

export function UniversalBootstrapRoute({
  workspaceSession = localOperationalWorkspaceSession,
  workspaceResolver = localOperationalWorkspaceResolver,
  migrateStorage = migrateLegacyOperationalStorage,
}: {
  workspaceSession?: OperationalWorkspaceSessionStore;
  workspaceResolver?: OperationalWorkspaceAccessResolver;
  migrateStorage?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    migrateStorage();
    void (async () => {
      const connected = workspaceSession.readConnected();
      if (!connected) {
        if (active) router.replace(universalApplicationRoutes.connect);
        return;
      }
      const currentWorkspace = await workspaceResolver.resolve(
        connected.workspace.accessCode,
      );
      if (
        !currentWorkspace ||
        currentWorkspace.workspaceId !== connected.workspace.workspaceId
      ) {
        workspaceSession.clear();
        if (active) router.replace(universalApplicationRoutes.connect);
        return;
      }
      workspaceSession.authorize(currentWorkspace);
      if (active) {
        router.replace(universalApplicationRoutes.workspace);
      }
    })().catch(() => {
      workspaceSession.clear();
      if (active) {
        router.replace(universalApplicationRoutes.connect);
      }
    });

    return () => {
      active = false;
    };
  }, [migrateStorage, router, workspaceResolver, workspaceSession]);

  return (
    <section className="text-center" aria-live="polite">
      <LoaderCircle
        className="mx-auto size-7 animate-spin text-[var(--action)] motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h1 className="mt-5 text-xl font-semibold">{t('universal.starting')}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t('universal.startingDescription')}
      </p>
    </section>
  );
}
