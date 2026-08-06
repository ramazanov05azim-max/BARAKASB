import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  SolutionConstructorService,
  SolutionConstructorState,
} from './solution-constructor-service';
import { SolutionConstructorScreen } from './solution-constructor-screen';

const initialState: SolutionConstructorState = {
  setup: {
    schemaVersion: 2,
    project: {
      id: 'coffee-1',
      name: 'Север',
      solutionId: 'coffee',
      categoryId: 'food',
      status: 'active',
      role: 'owner',
      createdAt: '2026-07-31T10:00:00.000Z',
    },
    installation: {
      id: 'installation-1',
      projectId: 'coffee-1',
      solutionId: 'coffee',
      status: 'installed',
      installedAt: '2026-07-31T10:00:00.000Z',
    },
    establishment: null,
    businessEnvironmentCode: '1234567890123456',
    businessEnvironmentId: 'environment-1',
    configuredAt: '2026-07-31T10:00:00.000Z',
    isDevelopmentDemo: false,
    crashTestSeedVersion: null,
  },
  structure: {
    selectedModuleIds: [],
    workspaces: [],
    generatedAt: null,
    updatedAt: '2026-07-31T10:00:00.000Z',
  },
  employees: [],
  accessCodes: [],
  connectedWorkspaceId: null,
  warehouses: [],
};

function service(
  state: SolutionConstructorState = initialState,
): SolutionConstructorService {
  return {
    load: vi.fn(async () => state),
    generate: vi.fn(async () => state),
    createEmployee: vi.fn(async () => state),
    updateEmployee: vi.fn(async () => state),
    setEmployeeActive: vi.fn(async () => state),
    deleteEmployee: vi.fn(async () => state),
    resetEmployeePassword: vi.fn(async () => state),
    assignEmployee: vi.fn(async () => state),
    assignWarehouse: vi.fn(async () => state),
    assignSourceWarehouse: vi.fn(async () => state),
    issueAccessCode: vi.fn(async () => state),
    rotateAccessCode: vi.fn(async () => state),
    disconnectDevice: vi.fn(async () => ({
      ...state,
      connectedWorkspaceId: null,
    })),
  };
}

describe('SolutionConstructorScreen', () => {
  it('shows Russian module names and sends only the selected identifiers', async () => {
    const user = userEvent.setup();
    const constructorService = service();
    render(
      <I18nProvider>
        <SolutionConstructorScreen projectId="coffee-1" service={constructorService} />
      </I18nProvider>,
    );

    expect(await screen.findByRole('button', { name: 'Бар' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Кухня' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bar' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Бар' }));
    await user.click(screen.getByRole('button', { name: 'Сформировать структуру' }));

    await waitFor(() =>
      expect(constructorService.generate).toHaveBeenCalledWith(
        'coffee-1',
        ['bar'],
        expect.objectContaining({ bar: 'Бар', kitchen: 'Кухня' }),
      ),
    );
  });

  it('sends owner-created employee details and password through the service boundary', async () => {
    const user = userEvent.setup();
    const constructorService = service();
    render(
      <I18nProvider>
        <SolutionConstructorScreen projectId="coffee-1" service={constructorService} />
      </I18nProvider>,
    );

    await screen.findByRole('heading', { name: '3. Сотрудники' });
    await user.type(screen.getByLabelText('Имя'), 'Иван');
    await user.type(screen.getByLabelText('Фамилия'), 'Петров');
    await user.type(screen.getByLabelText('Должность'), 'Бариста');
    await user.type(screen.getByLabelText('Телефон'), '+7 999 123-45-67');
    await user.type(screen.getByLabelText('Примечание'), 'Утренняя смена');
    await user.type(screen.getByLabelText('Пароль'), 'Coffee2026');
    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));

    await waitFor(() =>
      expect(constructorService.createEmployee).toHaveBeenCalledWith(
        'coffee-1',
        {
          firstName: 'Иван',
          lastName: 'Петров',
          position: 'Бариста',
          phone: '+7 999 123-45-67',
          notes: 'Утренняя смена',
          password: 'Coffee2026',
        },
        expect.objectContaining({ bar: 'Бар', manager: 'Руководитель' }),
      ),
    );
  });

  it('shows device connection and lets the owner disconnect it', async () => {
    const user = userEvent.setup();
    const connectedState: SolutionConstructorState = {
      ...initialState,
      structure: {
        selectedModuleIds: ['bar'],
        workspaces: [
          {
            id: 'workspace-bar',
            moduleId: 'bar',
            assignedEmployeeIds: [],
            status: 'active',
            createdAt: '2026-08-04T10:00:00.000Z',
            updatedAt: '2026-08-04T10:00:00.000Z',
          },
        ],
        generatedAt: '2026-08-04T10:00:00.000Z',
        updatedAt: '2026-08-04T10:00:00.000Z',
      },
      accessCodes: [
        {
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
        },
      ],
      connectedWorkspaceId: 'workspace-bar',
    };
    const constructorService = service(connectedState);
    render(
      <I18nProvider>
        <SolutionConstructorScreen projectId="coffee-1" service={constructorService} />
      </I18nProvider>,
    );

    expect(await screen.findByText('Устройство подключено')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Отключить устройство' }));

    await waitFor(() =>
      expect(constructorService.disconnectDevice).toHaveBeenCalledWith(
        'coffee-1',
        'workspace-bar',
      ),
    );
  });
});
