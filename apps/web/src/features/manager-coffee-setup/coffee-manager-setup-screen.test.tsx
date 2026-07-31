import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type {
  CoffeeManagerSetupRecord,
  CoffeeManagerSetupRepository,
} from './coffee-manager-setup-repository';
import { CoffeeManagerSetupScreen } from './coffee-manager-setup-screen';

const record: CoffeeManagerSetupRecord = {
  schemaVersion: 2,
  project: {
    id: 'coffee-1',
    name: 'North Star',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-31T10:00:00.000Z',
  },
  installation: {
    id: 'coffee-installation-coffee-1',
    projectId: 'coffee-1',
    solutionId: 'coffee',
    status: 'installed',
    installedAt: '2026-07-31T10:00:00.000Z',
  },
  establishment: null,
  businessEnvironmentCode: null,
  businessEnvironmentId: null,
  configuredAt: null,
  isDevelopmentDemo: false,
  crashTestSeedVersion: null,
};

function repository(): CoffeeManagerSetupRepository {
  return {
    install: vi.fn(async () => record),
    get: vi.fn(async () => record),
    list: vi.fn(async () => [record]),
    configure: vi.fn(async (_projectId, establishment) => ({
      ...record,
      establishment,
      businessEnvironmentCode: '1234567890123456',
      businessEnvironmentId: 'environment-1',
      configuredAt: '2026-07-31T10:00:00.000Z',
    })),
    installCrashTest: vi.fn(async () => record),
    deleteCrashTest: vi.fn(async () => undefined),
  };
}

describe('CoffeeManagerSetupScreen', () => {
  it('creates establishment configuration and code in Manager Platform', async () => {
    const managerRepository = repository();
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <CoffeeManagerSetupScreen projectId="coffee-1" repository={managerRepository} />
      </I18nProvider>,
    );

    await screen.findByRole('heading', { name: 'Настройте заведение' });
    await user.clear(screen.getByLabelText('Название заведения'));
    await user.type(screen.getByLabelText('Название заведения'), 'North Star');
    await user.type(screen.getByLabelText('Имя владельца'), 'Alex Morgan');
    await user.type(screen.getByLabelText('Город'), 'Moscow');
    await user.type(screen.getByLabelText('Адрес'), '12 Tverskaya Street');
    await user.type(screen.getByLabelText('Телефон'), '+7 999 123-45-67');
    await user.type(
      screen.getByLabelText('Электронная почта'),
      'owner@north-star.test',
    );
    await user.click(screen.getByRole('button', { name: 'Сохранить и создать код' }));

    expect(managerRepository.configure).toHaveBeenCalledWith(
      'coffee-1',
      expect.objectContaining({ establishmentName: 'North Star' }),
    );
    expect(
      await screen.findByTestId('generated-business-environment-code'),
    ).toHaveTextContent('1234 5678 9012 3456');
    expect(
      screen.queryByRole('link', { name: /Войти по коду/ }),
    ).not.toBeInTheDocument();
  });
});
