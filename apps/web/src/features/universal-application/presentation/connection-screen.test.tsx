import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  OperationalWorkspaceAccessResolver,
  OperationalWorkspaceSession,
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from '../application/workspace-access';
import { universalApplicationRoutes } from '../routes';
import { ConnectionScreen } from './connection-screen';
import { UniversalApplicationShell } from './universal-application-shell';

const { pushSpy, replaceSpy } = vi.hoisted(() => ({
  pushSpy: vi.fn(),
  replaceSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy, replace: replaceSpy }),
}));

const resolvedWorkspace: ResolvedOperationalWorkspace = {
  accessCode: '123456789012',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  isolationScopeId: 'environment-1',
  workspaceId: 'workspace-bar',
  workspaceType: 'bar',
  workspaceName: 'Бар',
  assignedEmployees: [],
  createdAt: '2026-07-31T10:00:00.000Z',
};

function workspaceResolver(
  resolved: ResolvedOperationalWorkspace | null = null,
): OperationalWorkspaceAccessResolver {
  return { resolve: vi.fn(async () => resolved) };
}

function workspaceSession(
  connected: OperationalWorkspaceSession | null = null,
): OperationalWorkspaceSessionStore {
  return {
    authorize: vi.fn(),
    readConnected: vi.fn(() => connected),
    authenticateEmployee: vi.fn(() => null),
    logoutEmployee: vi.fn(() => null),
    disconnect: vi.fn(() => false),
    clear: vi.fn(),
  };
}

function renderConnectionScreen(
  resolver: OperationalWorkspaceAccessResolver = workspaceResolver(),
  session: OperationalWorkspaceSessionStore = workspaceSession(),
) {
  return render(
    <I18nProvider>
      <UniversalApplicationShell>
        <ConnectionScreen
          workspaceResolver={resolver}
          workspaceSession={session}
          migrateStorage={vi.fn()}
        />
      </UniversalApplicationShell>
    </I18nProvider>,
  );
}

describe('ConnectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes only Workspace Code binding', () => {
    renderConnectionScreen();

    expect(
      screen.getByRole('heading', { name: 'Подключение рабочего пространства' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Код рабочего пространства')).toBeInTheDocument();
    expect(screen.queryByText(/бизнес-сред/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Название заведения')).not.toBeInTheDocument();
  });

  it('accepts digits, removes letters, and formats exactly 12 digits', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код рабочего пространства');

    fireEvent.change(input, { target: { value: '12ab3456cd7890ef12' } });

    expect(input).toHaveValue('1234 5678 9012');
  });

  it('keeps continue disabled for an incomplete Workspace Code', () => {
    renderConnectionScreen();
    fireEvent.change(screen.getByLabelText('Код рабочего пространства'), {
      target: { value: '1234' },
    });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Введите 12 цифр кода рабочего пространства.',
    );
  });

  it('binds the device and opens the canonical workspace route', async () => {
    const user = userEvent.setup();
    const resolver = workspaceResolver(resolvedWorkspace);
    const session = workspaceSession();
    renderConnectionScreen(resolver, session);

    await user.type(screen.getByLabelText('Код рабочего пространства'), '123456789012');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => {
      expect(resolver.resolve).toHaveBeenCalledWith('123456789012');
      expect(session.authorize).toHaveBeenCalledWith(resolvedWorkspace);
      expect(pushSpy).toHaveBeenCalledWith(universalApplicationRoutes.workspace);
    });
  });

  it('shows validation feedback for an unknown Workspace Code', async () => {
    const user = userEvent.setup();
    renderConnectionScreen(workspaceResolver(null));

    await user.type(screen.getByLabelText('Код рабочего пространства'), '999999999999');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Такой код рабочего пространства не найден.',
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('skips code entry when this device is already bound', async () => {
    renderConnectionScreen(
      workspaceResolver(),
      workspaceSession({
        workspace: resolvedWorkspace,
        currentEmployeeId: null,
      }),
    );

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.workspace),
    );
  });
});
