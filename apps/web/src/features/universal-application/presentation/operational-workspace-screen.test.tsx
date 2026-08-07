import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  OperationalEmployeeAuthenticator,
  OperationalWorkspaceAccessResolver,
  OperationalWorkspaceSession,
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from '../application/workspace-access';
import { universalApplicationRoutes } from '../routes';
import { OperationalWorkspaceScreen } from './operational-workspace-screen';

const { replaceSpy, routerMock } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replaceSpy: replace, routerMock: { replace } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

const workspace: ResolvedOperationalWorkspace = {
  accessCode: '123456789012',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  isolationScopeId: 'environment-1',
  workspaceId: 'workspace-manager',
  workspaceType: 'manager',
  workspaceName: 'Управляющий',
  assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Анна Петрова' }],
  createdAt: '2026-07-31T10:00:00.000Z',
};

const activeSession: OperationalWorkspaceSession = {
  workspace,
  currentEmployeeId: null,
};

function createSession(
  value: OperationalWorkspaceSession | null,
): OperationalWorkspaceSessionStore {
  let current = value;
  return {
    authorize: vi.fn((resolved) => {
      current = { workspace: resolved, currentEmployeeId: null };
    }),
    readConnected: vi.fn(() => current),
    authenticateEmployee: vi.fn((employeeId) => {
      current = current ? { ...current, currentEmployeeId: employeeId } : null;
      return current;
    }),
    logoutEmployee: vi.fn(() => {
      current = current ? { ...current, currentEmployeeId: null } : null;
      return current;
    }),
    disconnect: vi.fn(() => false),
    clear: vi.fn(),
  };
}

function resolver(
  value: ResolvedOperationalWorkspace | null = workspace,
): OperationalWorkspaceAccessResolver {
  return { resolve: vi.fn(async () => value) };
}

function authenticator(valid: boolean): OperationalEmployeeAuthenticator {
  return { verify: vi.fn(async () => valid) };
}

function renderWorkspace(
  session: OperationalWorkspaceSessionStore,
  employeeAuthenticator: OperationalEmployeeAuthenticator = authenticator(true),
  workspaceResolver: OperationalWorkspaceAccessResolver = resolver(),
) {
  return render(
    <I18nProvider>
      <OperationalWorkspaceScreen
        session={session}
        authenticator={employeeAuthenticator}
        workspaceResolver={workspaceResolver}
        migrateStorage={vi.fn()}
      />
    </I18nProvider>,
  );
}

describe('OperationalWorkspaceScreen', () => {
  it('authenticates an assigned employee and opens the workspace directly', async () => {
    const user = userEvent.setup();
    const session = createSession(activeSession);
    const employeeAuthenticator = authenticator(true);
    renderWorkspace(session, employeeAuthenticator);

    expect(
      await screen.findByRole('heading', { name: 'Выберите сотрудника' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('1234 5678 9012')).not.toBeInTheDocument();
    expect(screen.queryByText(/бизнес-сред/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/проект/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Анна Петрова' }));
    await user.type(screen.getByLabelText('Пароль'), 'Coffee2026');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(employeeAuthenticator.verify).toHaveBeenCalledWith({
        projectId: 'coffee-1',
        workspaceId: 'workspace-manager',
        employeeId: 'employee-1',
        password: 'Coffee2026',
      });
      expect(session.authenticateEmployee).toHaveBeenCalledWith('employee-1');
    });
    expect(
      await screen.findByRole('button', { name: 'Сменить сотрудника' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сменить сотрудника' }));
    expect(session.logoutEmployee).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('heading', { name: 'Выберите сотрудника' }),
    ).toBeInTheDocument();
    expect(session.clear).not.toHaveBeenCalled();
  });

  it('rejects an invalid employee password without opening the workspace', async () => {
    const user = userEvent.setup();
    const session = createSession(activeSession);
    renderWorkspace(session, authenticator(false));

    await user.click(await screen.findByRole('button', { name: 'Анна Петрова' }));
    await user.type(screen.getByLabelText('Пароль'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный пароль сотрудника.',
    );
    expect(session.authenticateEmployee).not.toHaveBeenCalled();
  });

  it('redirects an unbound device to Workspace Code entry without a fallback UI', async () => {
    const session = createSession(null);
    renderWorkspace(session);

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
    expect(
      screen.queryByRole('heading', { name: 'Рабочее пространство недоступно' }),
    ).not.toBeInTheDocument();
  });

  it('invalidates a device binding after its Workspace Code is rotated', async () => {
    const session = createSession(activeSession);
    renderWorkspace(session, authenticator(true), resolver(null));

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
    expect(session.clear).toHaveBeenCalledOnce();
  });
});
