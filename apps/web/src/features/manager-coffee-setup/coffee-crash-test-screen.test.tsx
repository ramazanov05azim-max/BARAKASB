import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import {
  coffeeCrashTestEnvironmentId,
  coffeeCrashTestProjectId,
  type CoffeeManagerSetupRecord,
} from './coffee-manager-setup-repository';
import { CoffeeCrashTestScreen } from './coffee-crash-test-screen';
import type {
  CoffeeCrashTestService,
  CoffeeCrashTestState,
} from './coffee-crash-test-service';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const record: CoffeeManagerSetupRecord = {
  schemaVersion: 2,
  project: {
    id: coffeeCrashTestProjectId,
    name: 'BARAKASB Coffee Crash Test',
    displayName: 'Север Coffee Lab — CRASH TEST',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-31T00:00:00.000Z',
    isDevelopmentDemo: true,
    developmentLabel: 'crash-test',
  },
  installation: {
    id: `coffee-installation-${coffeeCrashTestProjectId}`,
    projectId: coffeeCrashTestProjectId,
    solutionId: 'coffee',
    status: 'installed',
    installedAt: '2026-07-31T00:00:00.000Z',
  },
  establishment: null,
  businessEnvironmentCode: '5715422156485027',
  businessEnvironmentId: coffeeCrashTestEnvironmentId,
  configuredAt: '2026-07-31T00:00:00.000Z',
  isDevelopmentDemo: true,
  crashTestSeedVersion: 5,
};

function state(status: CoffeeCrashTestState['status']): CoffeeCrashTestState {
  return {
    status,
    record: status === 'installed' ? record : null,
    diagnostics: {
      projectCount: status === 'installed' ? 1 : 0,
      installationCount: status === 'installed' ? 1 : 0,
      environmentCount: status === 'installed' ? 1 : 0,
      selectedProjectId: status === 'installed' ? coffeeCrashTestProjectId : null,
      obsoleteKeyCount: 0,
      schemaVersion: status === 'installed' ? 2 : null,
    },
  };
}

function service(initial: CoffeeCrashTestState): CoffeeCrashTestService {
  return {
    inspect: vi.fn(async () => initial),
    resetAndInstall: vi.fn(async () => state('installed')),
    delete: vi.fn(async () => state('not-installed')),
  };
}

describe('CoffeeCrashTestScreen', () => {
  it('shows the exact installed environment and copyable code', async () => {
    render(
      <I18nProvider>
        <CoffeeCrashTestScreen service={service(state('installed'))} />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Север Coffee Lab — CRASH TEST',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('CRASH TEST · DEV DEMO')).toBeInTheDocument();
    expect(screen.getByText('5715 4221 5648 5027')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть проект' })).toHaveAttribute(
      'href',
      `/projects/${coffeeCrashTestProjectId}`,
    );
  });

  it('requires explicit confirmation before destructive reset', async () => {
    const repository = service(state('not-installed'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <CoffeeCrashTestScreen service={repository} />
      </I18nProvider>,
    );

    await user.click(
      await screen.findByRole('button', {
        name: 'Обновить тестовое окружение',
      }),
    );

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('DEV ONLY'));
    expect(repository.resetAndInstall).not.toHaveBeenCalled();
  });

  it('performs one navigation after a successful reset', async () => {
    const repository = service(state('not-installed'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <CoffeeCrashTestScreen service={repository} />
      </I18nProvider>,
    );

    await user.click(
      await screen.findByRole('button', {
        name: 'Обновить тестовое окружение',
      }),
    );

    expect(repository.resetAndInstall).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(
      `/projects/${coffeeCrashTestProjectId}?crashTestInstalled=1`,
    );
  });
});
