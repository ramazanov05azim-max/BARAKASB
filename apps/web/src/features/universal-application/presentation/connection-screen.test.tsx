import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  LocalCoffeeOnboardingRepository,
  LocalCoffeeProjectRecord,
} from '@/features/coffee-onboarding/local-coffee-onboarding-repository';
import { I18nProvider } from '@/i18n/i18n-provider';
import { ConnectionScreen } from './connection-screen';
import { UniversalApplicationShell } from './universal-application-shell';

const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy }),
}));

const resolvedEnvironment: LocalCoffeeProjectRecord = {
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
    legalName: '',
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

function createRepository({
  hasProjects = true,
  resolved = resolvedEnvironment,
}: {
  hasProjects?: boolean;
  resolved?: LocalCoffeeProjectRecord | null;
} = {}): LocalCoffeeOnboardingRepository {
  return {
    list: vi.fn(async () => (hasProjects ? [resolvedEnvironment] : [])),
    hasProjects: vi.fn(async () => hasProjects),
    create: vi.fn(async () => resolvedEnvironment),
    resolve: vi.fn(async () => resolved),
  };
}

function renderConnectionScreen(
  repository: LocalCoffeeOnboardingRepository = createRepository(),
) {
  return render(
    <I18nProvider>
      <UniversalApplicationShell>
        <ConnectionScreen repository={repository} />
      </UniversalApplicationShell>
    </I18nProvider>,
  );
}

describe('ConnectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the start screen, brand, application name, label, and version', async () => {
    renderConnectionScreen();

    expect(
      await screen.findByRole('heading', { name: 'Подключение к бизнес-среде' }),
    ).toBeInTheDocument();
    expect(screen.getByText('BARAKASB')).toBeInTheDocument();
    expect(screen.getByText('Универсальное приложение')).toBeInTheDocument();
    expect(screen.getByLabelText('Код бизнес-среды')).toBeInTheDocument();
    expect(screen.getByText('Версия 0.1.0')).toBeInTheDocument();
  });

  it('shows Create Coffee when local storage has no Coffee Project', async () => {
    renderConnectionScreen(createRepository({ hasProjects: false }));

    expect(
      await screen.findByRole('heading', {
        name: 'Создайте первый Coffee Project',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Создать Coffee/ })).toHaveAttribute(
      'href',
      '/projects/new/coffee',
    );
  });

  it('accepts digits, removes letters, and formats groups of four', async () => {
    renderConnectionScreen();
    const input = await screen.findByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '12ab3456cd7890' } });

    expect(input).toHaveValue('1234 5678 90');
  });

  it('normalizes a pasted formatted code and limits it to sixteen digits', async () => {
    renderConnectionScreen();
    const input = await screen.findByLabelText('Код бизнес-среды');

    fireEvent.change(input, {
      target: { value: '1234-5678 9012-3456-9999' },
    });

    expect(input).toHaveValue('1234 5678 9012 3456');
  });

  it('keeps continue disabled for an incomplete code', async () => {
    renderConnectionScreen();
    const input = await screen.findByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '1234' } });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Введите все 16 цифр кода.');
  });

  it('enables continue for a complete code', async () => {
    renderConnectionScreen();
    const input = await screen.findByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '1234567890123456' } });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('resolves a valid local code and opens only its Coffee Project', async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    renderConnectionScreen(repository);
    const input = await screen.findByLabelText('Код бизнес-среды');

    await user.type(input, '1234567890123456');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => {
      expect(repository.resolve).toHaveBeenCalledWith('1234567890123456');
      expect(pushSpy).toHaveBeenCalledWith('/projects/coffee-1/coffee');
    });
  });

  it('shows a validation error for an unknown complete code', async () => {
    const user = userEvent.setup();
    renderConnectionScreen(createRepository({ resolved: null }));
    const input = await screen.findByLabelText('Код бизнес-среды');

    await user.type(input, '9999999999999999');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Такой код не найден в этом браузере.',
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('never writes the Business Environment Code to console', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderConnectionScreen();

    await user.type(
      await screen.findByLabelText('Код бизнес-среды'),
      '1234567890123456',
    );
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('supports logical keyboard navigation', async () => {
    const user = userEvent.setup();
    renderConnectionScreen();

    await screen.findByLabelText('Код бизнес-среды');
    await user.tab();
    expect(screen.getByRole('link', { name: 'BARAKASB — на главную' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Язык интерфейса')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Код бизнес-среды')).toHaveFocus();
  });
});
