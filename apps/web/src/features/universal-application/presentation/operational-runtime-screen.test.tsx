import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createCoffeeCrashTestSeed,
  localCoffeeManagerRepositories,
} from '@barakasb/solution-coffee';
import type {
  OperationalRuntimeSessionStore,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';
import { I18nProvider } from '@/i18n/i18n-provider';
import { OperationalRuntimeScreen } from './operational-runtime-screen';

const environment: ResolvedBusinessEnvironment = {
  businessEnvironmentId: 'environment-1',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  displayName: 'North Star',
  status: 'active',
  createdAt: '2026-07-31T10:00:00.000Z',
  developmentDemo: false,
};

function session(
  value: ResolvedBusinessEnvironment | null,
): OperationalRuntimeSessionStore {
  return {
    authorize: vi.fn(),
    read: vi.fn(() => value),
    clear: vi.fn(),
  };
}

describe('OperationalRuntimeScreen', () => {
  it('shows honest disabled readiness without manager-owned editing', async () => {
    window.localStorage.clear();
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'coffee-1',
      'North Star',
    );
    await localCoffeeManagerRepositories.developmentSeed.apply(
      'coffee-1',
      createCoffeeCrashTestSeed('2026-07-31T00:00:00.000Z'),
    );
    render(
      <I18nProvider>
        <OperationalRuntimeScreen projectId="coffee-1" session={session(environment)} />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'North Star' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Приёмка товаров')).toBeInTheDocument();
    expect(screen.getAllByText('Ещё не реализовано')).toHaveLength(7);
    expect(
      await screen.findByRole('heading', {
        name: 'Идентификация окружения',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Север Coffee Lab — CRASH TEST')).toBeInTheDocument();
    expect(screen.getByText('Сводка настроенных данных')).toBeInTheDocument();
    expect(screen.getByText('Доступный каталог')).toBeInTheDocument();
    expect(screen.getByText('Начальные остатки')).toBeInTheDocument();
    expect(screen.queryByLabelText('Название заведения')).not.toBeInTheDocument();
    expect(screen.queryByText(/создать код/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/изменить код/i)).not.toBeInTheDocument();
  });

  it('rejects direct runtime entry without a resolved session', async () => {
    render(
      <I18nProvider>
        <OperationalRuntimeScreen projectId="coffee-1" session={session(null)} />
      </I18nProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Введите код бизнес-среды' }),
    ).toBeInTheDocument();
  });
});
