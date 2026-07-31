import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
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
    workspaceId: 'workspace-bar',
    workspaceName: 'Бар',
    assignedEmployees: [{ employeeId: 'employee-1', displayName: 'Анна Петрова' }],
    createdAt: '2026-07-31T10:00:00.000Z',
  },
  currentEmployeeId: null,
};

function createSession(
  value: OperationalWorkspaceSession | null,
): OperationalWorkspaceSessionStore {
  return {
    authorize: vi.fn(),
    read: vi.fn(() => value),
    selectEmployee: vi.fn((_projectId, _workspaceId, employeeId) =>
      value ? { ...value, currentEmployeeId: employeeId } : null,
    ),
    clear: vi.fn(),
  };
}

describe('OperationalWorkspaceScreen', () => {
  it('renders a Russian placeholder with environment, code and employee context', () => {
    const session = createSession(activeSession);
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-bar"
          session={session}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Бар' })).toBeInTheDocument();
    expect(screen.getByText('Север')).toBeInTheDocument();
    expect(screen.getByText('1234 5678 9012')).toBeInTheDocument();
    expect(screen.getAllByText('Анна Петрова')).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Выберите текущего сотрудника'), {
      target: { value: 'employee-1' },
    });
    expect(session.selectEmployee).toHaveBeenCalledWith(
      'coffee-1',
      'workspace-bar',
      'employee-1',
    );
  });

  it('rejects a deep link without an authorized workspace session', () => {
    render(
      <I18nProvider>
        <OperationalWorkspaceScreen
          projectId="coffee-1"
          workspaceId="workspace-bar"
          session={createSession(null)}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Рабочее пространство недоступно' }),
    ).toBeInTheDocument();
  });
});
