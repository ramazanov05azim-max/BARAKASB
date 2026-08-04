import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CoffeeManagerSetupRecord } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import type { SolutionConstructorState } from '@/features/solution-constructor/solution-constructor-service';
import { I18nProvider } from '@/i18n/i18n-provider';
import type { ProjectSummary } from '@/lib/mock-repository';
import { ProjectDashboard } from './project-dashboard';

const project: ProjectSummary = {
  id: 'coffee-1',
  name: 'Север',
  solutionId: 'coffee',
  categoryId: 'food',
  status: 'active',
  role: 'owner',
  createdAt: '2026-08-04T10:00:00.000Z',
};

const setup: CoffeeManagerSetupRecord = {
  schemaVersion: 2,
  project,
  installation: {
    id: 'installation-1',
    projectId: project.id,
    solutionId: 'coffee',
    status: 'installed',
    installedAt: project.createdAt,
  },
  establishment: {
    establishmentName: 'Север',
    legalName: '',
    ownerName: 'Анна',
    country: 'RU',
    city: 'Москва',
    address: 'Тверская, 12',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    language: 'ru',
    phone: '+7 999 111-22-33',
    email: 'owner@example.test',
  },
  businessEnvironmentCode: '1234567890123456',
  businessEnvironmentId: 'environment-1',
  configuredAt: project.createdAt,
  isDevelopmentDemo: false,
  crashTestSeedVersion: null,
};

const constructorState: SolutionConstructorState = {
  setup,
  structure: {
    selectedModuleIds: ['bar', 'kitchen'],
    workspaces: [
      {
        id: 'workspace-bar',
        moduleId: 'bar',
        assignedEmployeeIds: ['employee-1'],
        status: 'active',
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
      },
      {
        id: 'workspace-kitchen',
        moduleId: 'kitchen',
        assignedEmployeeIds: [],
        status: 'active',
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
      },
    ],
    generatedAt: project.createdAt,
    updatedAt: project.createdAt,
  },
  employees: [],
  accessCodes: [],
  connectedWorkspaceId: null,
};

describe('ProjectDashboard Coffee overview', () => {
  it('shows practical setup and direct workspace actions without internal codes', async () => {
    render(
      <I18nProvider>
        <ProjectDashboard
          projectId={project.id}
          projectRepository={{ getProject: vi.fn(async () => project) }}
          setupRepository={{ get: vi.fn(async () => setup) }}
          constructorService={{ load: vi.fn(async () => constructorState) }}
        />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Настройка решения' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Рабочие пространства' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Бар')).toBeInTheDocument();
    expect(screen.getByText('Кухня')).toBeInTheDocument();
    expect(screen.getByText('Сотрудников: 1')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: /Открыть/ })
        .map((link) => link.getAttribute('href')),
    ).toEqual(
      expect.arrayContaining([
        '/projects/coffee-1/admin/solutions/coffee/workspaces/workspace-bar/open',
        '/projects/coffee-1/admin/solutions/coffee/workspaces/workspace-kitchen/open',
      ]),
    );
    expect(screen.queryByText('1234 5678 9012 3456')).not.toBeInTheDocument();
    expect(screen.queryByText('Ваш код бизнес-среды готов')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Открыть универсальное приложение' }),
    ).not.toBeInTheDocument();
  });
});
