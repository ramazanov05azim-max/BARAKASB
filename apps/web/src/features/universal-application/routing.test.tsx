import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UniversalApplicationConnectPage from '@/app/app/connect/page';
import InvalidUniversalApplicationRoute from '@/app/app/[...invalidUniversalPath]/page';
import UniversalApplicationUnavailablePage from '@/app/app/unavailable/page';
import OperationalRuntimePage from '@/app/app/runtime/[projectId]/page';
import OperationalWorkspacePage from '@/app/app/runtime/[projectId]/workspaces/[workspaceId]/page';
import { I18nProvider } from '@/i18n/i18n-provider';
import { UniversalBootstrapRoute } from './presentation/bootstrap-route';
import { universalApplicationRoutes, universalApplicationRouteValues } from './routes';
import type { OperationalWorkspaceSessionStore } from './application/workspace-access';

const { redirectSpy, replaceSpy } = vi.hoisted(() => ({
  redirectSpy: vi.fn(),
  replaceSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectSpy,
  useRouter: () => ({ replace: replaceSpy }),
}));

describe('Universal Application routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('uses namespaced routes inside the single apps/web shell', () => {
    expect(universalApplicationRoutes).toEqual({
      root: '/app',
      connect: '/app/connect',
      runtime: '/app/runtime',
      unavailable: '/app/unavailable',
    });
    expect(
      universalApplicationRouteValues.every((route) => !route.includes('coffee')),
    ).toBe(true);
  });

  it('starts bootstrap and redirects to the environment-code route', async () => {
    render(
      <I18nProvider>
        <UniversalBootstrapRoute />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Запуск приложения' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
  });

  it('returns a previously connected device directly to its workspace', async () => {
    const workspaceSession: OperationalWorkspaceSessionStore = {
      authorize: vi.fn(),
      readConnected: vi.fn(() => ({
        workspace: {
          accessCode: '123456789012',
          projectId: 'coffee-1',
          solutionId: 'coffee',
          solutionInstallationId: 'installation-1',
          businessEnvironmentId: 'environment-1',
          environmentDisplayName: 'Север',
          workspaceId: 'workspace-bar',
          workspaceType: 'bar',
          workspaceName: 'Бар',
          assignedEmployees: [],
          createdAt: '2026-08-04T10:00:00.000Z',
        },
        currentEmployeeId: null,
      })),
      read: vi.fn(() => null),
      authenticateEmployee: vi.fn(() => null),
      logoutEmployee: vi.fn(() => null),
      clear: vi.fn(),
    };

    render(
      <I18nProvider>
        <UniversalBootstrapRoute workspaceSession={workspaceSession} />
      </I18nProvider>,
    );

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(
        '/app/runtime/coffee-1/workspaces/workspace-bar',
      ),
    );
  });

  it('renders the connection route', () => {
    const page = UniversalApplicationConnectPage();
    render(<I18nProvider>{page}</I18nProvider>);

    expect(
      screen.getByRole('heading', { name: 'Подключение к бизнес-среде' }),
    ).toBeInTheDocument();
  });

  it('renders a project-scoped operational route safely without a session', async () => {
    const page = await OperationalRuntimePage({
      params: Promise.resolve({ projectId: 'coffee-1' }),
    });
    render(<I18nProvider>{page}</I18nProvider>);

    expect(
      await screen.findByRole('heading', { name: 'Введите код бизнес-среды' }),
    ).toBeInTheDocument();
  });

  it('renders a workspace-scoped route safely without a session', async () => {
    const page = await OperationalWorkspacePage({
      params: Promise.resolve({
        projectId: 'coffee-1',
        workspaceId: 'workspace-bar',
      }),
    });
    render(<I18nProvider>{page}</I18nProvider>);

    expect(
      screen.getByRole('heading', { name: 'Рабочее пространство недоступно' }),
    ).toBeInTheDocument();
  });

  it('renders a neutral unavailable route', () => {
    render(
      <I18nProvider>
        <UniversalApplicationUnavailablePage />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Приложение временно недоступно' }),
    ).toBeInTheDocument();
  });

  it('returns an unknown Universal Application route to the safe root', () => {
    InvalidUniversalApplicationRoute();
    expect(redirectSpy).toHaveBeenCalledWith(universalApplicationRoutes.root);
  });
});
