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
};

function service(): SolutionConstructorService {
  return {
    load: vi.fn(async () => initialState),
    generate: vi.fn(async () => initialState),
    createEmployee: vi.fn(async () => initialState),
    updateEmployee: vi.fn(async () => initialState),
    setEmployeeActive: vi.fn(async () => initialState),
    deleteEmployee: vi.fn(async () => initialState),
    resetEmployeePassword: vi.fn(async () => initialState),
    assignEmployee: vi.fn(async () => initialState),
    issueAccessCode: vi.fn(async () => initialState),
    rotateAccessCode: vi.fn(async () => initialState),
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
});
