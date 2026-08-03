import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  OperationalEmployeeAuthenticator,
  OperationalWorkspaceSession,
  OperationalWorkspaceSessionStore,
} from '../application/workspace-access';
import { OperationalWorkspaceScreen } from './operational-workspace-screen';

const activeSession: OperationalWorkspaceSession = {
  workspace: {
    accessCode: '123456789012',
    projectId: 'coffee-1',
    solutionId: 'coffee',
    solutionInstallationId: 'installation-1',
    businessEnvironmentId: 'environment-1',
    environmentDisplayName: 'Север',
    workspaceId: 'workspace-manager',
    workspaceType: 'manager',
    workspaceName: 'Руководитель',
    assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Анна Петрова' }],
    createdAt: '2026-07-31T10:00:00.000Z',
  },
  currentEmployeeId: null,
};

function createSession(
  value: OperationalWorkspaceSession | null,
): OperationalWorkspaceSessionStore {
  let current = value;
  return {
    authorize: vi.fn(),
    readConnected: vi.fn(() => current),
    read: vi.fn(() => current),
    authenticateEmployee: vi.fn((_projectId, _workspaceId, employeeId) => {
      current = current ? { ...current, currentEmployeeId: employeeId } : null;
      return current;
    }),
    logoutEmployee: vi.fn(() => {
      current = current ? { ...current, currentEmployeeId: null } : null;
      return current;
    }),
    clear: vi.fn(),
  };
}

function authenticator(valid: boolean): OperationalEmployeeAuthenticator {
  return { verify: vi.fn(async () => valid) };
}

describe('OperationalWorkspaceScreen', () => {
  it('authenticates an assigned employee without exposing the workspace code', async () => {
    const user = userEvent.setup();
    const session = createSession(activeSession);
    const employeeAuthenticator = authenticator(true);
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-manager"
          session={session}
          authenticator={employeeAuthenticator}
        />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Выберите сотрудника' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('1234 5678 9012')).not.toBeInTheDocument();

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
      expect(session.authenticateEmployee).toHaveBeenCalledWith(
        'coffee-1',
        'workspace-manager',
        'employee-1',
      );
    });
    expect(
      screen.getByRole('button', { name: 'Сменить сотрудника' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('1234 5678 9012')).not.toBeInTheDocument();
  });

  it('rejects an invalid employee password without opening the workspace', async () => {
    const user = userEvent.setup();
    const session = createSession(activeSession);
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-manager"
          session={session}
          authenticator={authenticator(false)}
        />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Анна Петрова' }));
    await user.type(screen.getByLabelText('Пароль'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный пароль сотрудника.',
    );
    expect(session.authenticateEmployee).not.toHaveBeenCalled();
  });

  it('changes the employee without disconnecting the device', async () => {
    const user = userEvent.setup();
    const authenticated: OperationalWorkspaceSession = {
      ...activeSession,
      currentEmployeeId: 'employee-1',
    };
    const session = createSession(authenticated);
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-manager"
          session={session}
        />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Сменить сотрудника' }));

    expect(session.logoutEmployee).toHaveBeenCalledWith(
      'coffee-1',
      'workspace-manager',
    );
    expect(
      screen.getByRole('heading', { name: 'Выберите сотрудника' }),
    ).toBeInTheDocument();
    expect(session.clear).not.toHaveBeenCalled();
  });

  it('rejects a deep link without an authorized workspace session', async () => {
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-manager"
          session={createSession(null)}
        />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Рабочее пространство недоступно',
      }),
    ).toBeInTheDocument();
  });
});
