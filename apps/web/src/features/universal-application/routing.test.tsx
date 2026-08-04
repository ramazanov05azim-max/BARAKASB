import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UniversalApplicationConnectPage from '@/app/app/connect/page';
import OperationalWorkspacePage from '@/app/app/workspace/page';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  OperationalWorkspaceAccessResolver,
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from './application/workspace-access';
import { UniversalBootstrapRoute } from './presentation/bootstrap-route';
import { universalApplicationRoutes, universalApplicationRouteValues } from './routes';

const { replaceSpy } = vi.hoisted(() => ({
  replaceSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceSpy }),
}));

const workspace: ResolvedOperationalWorkspace = {
  accessCode: '123456789012',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  isolationScopeId: 'environment-1',
  workspaceId: 'workspace-bar',
  workspaceType: 'bar',
  workspaceName: 'Бар',
  assignedEmployees: [],
  createdAt: '2026-08-04T10:00:00.000Z',
};

function session(connected: boolean): OperationalWorkspaceSessionStore {
  return {
    authorize: vi.fn(),
    readConnected: vi.fn(() =>
      connected ? { workspace, currentEmployeeId: null } : null,
    ),
    authenticateEmployee: vi.fn(() => null),
    logoutEmployee: vi.fn(() => null),
    disconnect: vi.fn(() => false),
    clear: vi.fn(),
  };
}

function resolver(
  resolved: ResolvedOperationalWorkspace | null,
): OperationalWorkspaceAccessResolver {
  return { resolve: vi.fn(async () => resolved) };
}

describe('Universal Application routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('contains only the canonical Workspace routes in apps/web', () => {
    expect(universalApplicationRoutes).toEqual({
      root: '/app',
      connect: '/app/connect',
      workspace: '/app/workspace',
    });
    expect(
      universalApplicationRouteValues.every((route) => !route.includes('coffee')),
    ).toBe(true);
  });

  it('redirects an unbound device to Workspace Code entry', async () => {
    render(
      <I18nProvider>
        <UniversalBootstrapRoute
          workspaceSession={session(false)}
          workspaceResolver={resolver(null)}
          migrateStorage={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Запуск приложения' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
  });

  it('returns a valid bound device directly to employee login', async () => {
    const workspaceSession = session(true);
    render(
      <I18nProvider>
        <UniversalBootstrapRoute
          workspaceSession={workspaceSession}
          workspaceResolver={resolver(workspace)}
          migrateStorage={vi.fn()}
        />
      </I18nProvider>,
    );

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.workspace),
    );
    expect(workspaceSession.authorize).toHaveBeenCalledWith(workspace);
  });

  it('invalidates a stale binding instead of opening a fallback runtime', async () => {
    const workspaceSession = session(true);
    render(
      <I18nProvider>
        <UniversalBootstrapRoute
          workspaceSession={workspaceSession}
          workspaceResolver={resolver(null)}
          migrateStorage={vi.fn()}
        />
      </I18nProvider>,
    );

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
    expect(workspaceSession.clear).toHaveBeenCalledOnce();
  });

  it('renders the Workspace Code connection route', () => {
    const page = UniversalApplicationConnectPage();
    render(<I18nProvider>{page}</I18nProvider>);

    expect(
      screen.getByRole('heading', { name: 'Подключение рабочего пространства' }),
    ).toBeInTheDocument();
  });

  it('renders the canonical workspace route without URL identifiers', async () => {
    const page = OperationalWorkspacePage();
    render(<I18nProvider>{page}</I18nProvider>);

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
  });
});
