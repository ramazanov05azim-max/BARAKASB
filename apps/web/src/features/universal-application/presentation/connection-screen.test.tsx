import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BusinessEnvironmentResolver,
  OperationalRuntimeSessionStore,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';
import { I18nProvider } from '@/i18n/i18n-provider';
import { ConnectionScreen } from './connection-screen';
import { UniversalApplicationShell } from './universal-application-shell';

const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy }),
}));

const resolvedEnvironment: ResolvedBusinessEnvironment = {
  businessEnvironmentId: 'environment-1',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  displayName: 'North Star',
  status: 'active',
  createdAt: '2026-07-31T10:00:00.000Z',
  developmentDemo: false,
};

function createResolver(
  resolved: ResolvedBusinessEnvironment | null = resolvedEnvironment,
): BusinessEnvironmentResolver {
  return { resolve: vi.fn(async () => resolved) };
}

function createSession(): OperationalRuntimeSessionStore {
  return {
    authorize: vi.fn(),
    read: vi.fn(() => null),
    clear: vi.fn(),
  };
}

function renderConnectionScreen(
  resolver: BusinessEnvironmentResolver = createResolver(),
  session: OperationalRuntimeSessionStore = createSession(),
) {
  return render(
    <I18nProvider>
      <UniversalApplicationShell>
        <ConnectionScreen resolver={resolver} session={session} />
      </UniversalApplicationShell>
    </I18nProvider>,
  );
}

describe('ConnectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes only code resolution and never establishment creation', () => {
    renderConnectionScreen();

    expect(
      screen.getByRole('heading', { name: 'Подключение к бизнес-среде' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Код бизнес-среды')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Создать Coffee/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Название заведения')).not.toBeInTheDocument();
  });

  it('accepts digits, removes letters, and formats groups of four', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '12ab3456cd7890' } });

    expect(input).toHaveValue('1234 5678 90');
  });

  it('keeps continue disabled for an incomplete code', () => {
    renderConnectionScreen();
    fireEvent.change(screen.getByLabelText('Код бизнес-среды'), {
      target: { value: '1234' },
    });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Введите все 16 цифр кода.');
  });

  it('resolves a manager-created code and opens operational runtime', async () => {
    const user = userEvent.setup();
    const resolver = createResolver();
    const session = createSession();
    renderConnectionScreen(resolver, session);

    await user.type(screen.getByLabelText('Код бизнес-среды'), '1234567890123456');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => {
      expect(resolver.resolve).toHaveBeenCalledWith('1234567890123456');
      expect(session.authorize).toHaveBeenCalledWith(resolvedEnvironment);
      expect(pushSpy).toHaveBeenCalledWith('/app/runtime/coffee-1');
    });
  });

  it('shows validation feedback for an unknown code', async () => {
    const user = userEvent.setup();
    renderConnectionScreen(createResolver(null));

    await user.type(screen.getByLabelText('Код бизнес-среды'), '9999999999999999');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Такой код не найден в этом браузере.',
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });
});
