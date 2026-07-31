import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BusinessEnvironmentResolver,
  OperationalRuntimeSessionStore,
  ResolvedBusinessEnvironment,
} from '../application/business-environment-resolution';
import type {
  OperationalWorkspaceAccessResolver,
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from '../application/workspace-access';
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

const resolvedWorkspace: ResolvedOperationalWorkspace = {
  accessCode: '123456789012',
  projectId: 'coffee-1',
  solutionId: 'coffee',
  solutionInstallationId: 'installation-1',
  businessEnvironmentId: 'environment-1',
  environmentDisplayName: 'Север',
  workspaceId: 'workspace-bar',
  workspaceName: 'Бар',
  assignedEmployees: [],
  createdAt: '2026-07-31T10:00:00.000Z',
};

function createWorkspaceResolver(
  resolved: ResolvedOperationalWorkspace | null = null,
): OperationalWorkspaceAccessResolver {
  return { resolve: vi.fn(async () => resolved) };
}

function createWorkspaceSession(): OperationalWorkspaceSessionStore {
  return {
    authorize: vi.fn(),
    read: vi.fn(() => null),
    selectEmployee: vi.fn(() => null),
    clear: vi.fn(),
  };
}

function renderConnectionScreen(
  resolver: BusinessEnvironmentResolver = createResolver(),
  session: OperationalRuntimeSessionStore = createSession(),
  workspaceResolver: OperationalWorkspaceAccessResolver = createWorkspaceResolver(),
  workspaceSession: OperationalWorkspaceSessionStore = createWorkspaceSession(),
) {
  return render(
    <I18nProvider>
      <UniversalApplicationShell>
        <ConnectionScreen
          resolver={resolver}
          session={session}
          workspaceResolver={workspaceResolver}
          workspaceSession={workspaceSession}
        />
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
    expect(screen.getByLabelText('Код доступа')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Создать Coffee/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Название заведения')).not.toBeInTheDocument();
  });

  it('accepts digits, removes letters, and formats groups of four', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код доступа');

    fireEvent.change(input, { target: { value: '12ab3456cd7890' } });

    expect(input).toHaveValue('1234 5678 90');
  });

  it('keeps continue disabled for an incomplete code', () => {
    renderConnectionScreen();
    fireEvent.change(screen.getByLabelText('Код доступа'), {
      target: { value: '1234' },
    });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Введите 12 или 16 цифр кода.');
  });

  it('resolves a manager-created code and opens operational runtime', async () => {
    const user = userEvent.setup();
    const resolver = createResolver();
    const session = createSession();
    renderConnectionScreen(resolver, session);

    await user.type(screen.getByLabelText('Код доступа'), '1234567890123456');
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

    await user.type(screen.getByLabelText('Код доступа'), '9999999999999999');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Такой код не найден в этом браузере.',
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('resolves a Workspace Access Code and opens only that workspace', async () => {
    const user = userEvent.setup();
    const environmentSession = createSession();
    const workspaceResolver = createWorkspaceResolver(resolvedWorkspace);
    const workspaceSession = createWorkspaceSession();
    renderConnectionScreen(
      createResolver(),
      environmentSession,
      workspaceResolver,
      workspaceSession,
    );

    await user.type(screen.getByLabelText('Код доступа'), '123456789012');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => {
      expect(workspaceResolver.resolve).toHaveBeenCalledWith('123456789012');
      expect(workspaceSession.authorize).toHaveBeenCalledWith(resolvedWorkspace);
      expect(environmentSession.clear).toHaveBeenCalled();
      expect(pushSpy).toHaveBeenCalledWith(
        '/app/runtime/coffee-1/workspaces/workspace-bar',
      );
    });
  });
});
