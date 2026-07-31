import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import {
  type CoffeeEstablishmentInput,
  type LocalCoffeeOnboardingRepository,
  type LocalCoffeeProjectRecord,
} from './local-coffee-onboarding-repository';
import { CoffeeOnboardingScreen } from './coffee-onboarding-screen';

const createdRecord: LocalCoffeeProjectRecord = {
  schemaVersion: 1,
  project: {
    id: 'coffee-1',
    name: 'North Star',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-31T10:00:00.000Z',
  },
  businessEnvironmentCode: '1234567890123456',
  establishment: {
    establishmentName: 'North Star',
    legalName: 'North Star Coffee LLC',
    ownerName: 'Alex Morgan',
    country: 'RU',
    city: 'Moscow',
    address: '12 Tverskaya Street',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    language: 'ru',
    phone: '+7 999 123-45-67',
    email: 'owner@north-star.test',
  },
  createdAt: '2026-07-31T10:00:00.000Z',
};

function createRepository(): LocalCoffeeOnboardingRepository {
  return {
    list: vi.fn(async () => []),
    hasProjects: vi.fn(async () => false),
    create: vi.fn(async () => createdRecord),
    resolve: vi.fn(async () => null),
  };
}

function renderScreen(repository: LocalCoffeeOnboardingRepository) {
  return render(
    <I18nProvider>
      <CoffeeOnboardingScreen repository={repository} />
    </I18nProvider>,
  );
}

describe('CoffeeOnboardingScreen', () => {
  it('shows field-level errors and blocks an invalid establishment', async () => {
    const repository = createRepository();
    const user = userEvent.setup();
    renderScreen(repository);

    await user.click(screen.getByRole('button', { name: 'Создать Coffee Project' }));

    expect(
      await screen.findByText('Введите название заведения — не менее 2 символов.'),
    ).toBeInTheDocument();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('submits the complete establishment and displays the generated code', async () => {
    const repository = createRepository();
    const user = userEvent.setup();
    renderScreen(repository);

    await user.type(screen.getByLabelText('Название заведения'), 'North Star');
    await user.type(
      screen.getByLabelText('Юридическое название'),
      'North Star Coffee LLC',
    );
    await user.type(screen.getByLabelText('Имя владельца'), 'Alex Morgan');
    await user.type(screen.getByLabelText('Город'), 'Moscow');
    await user.type(screen.getByLabelText('Адрес'), '12 Tverskaya Street');
    await user.type(screen.getByLabelText('Телефон'), '+7 999 123-45-67');
    await user.type(
      screen.getByLabelText('Электронная почта'),
      'owner@north-star.test',
    );
    await user.click(screen.getByRole('button', { name: 'Создать Coffee Project' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Ваш код бизнес-среды готов',
      }),
    ).toBeInTheDocument();
    expect(repository.create).toHaveBeenCalledWith({
      establishmentName: 'North Star',
      legalName: 'North Star Coffee LLC',
      ownerName: 'Alex Morgan',
      country: 'RU',
      city: 'Moscow',
      address: '12 Tverskaya Street',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      language: 'ru',
      phone: '+7 999 123-45-67',
      email: 'owner@north-star.test',
    } satisfies CoffeeEstablishmentInput);
    expect(screen.getByTestId('generated-business-environment-code')).toHaveTextContent(
      '1234 5678 9012 3456',
    );
  });
});
