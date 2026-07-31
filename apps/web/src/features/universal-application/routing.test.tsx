import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UniversalApplicationConnectPage from '@/app/app/connect/page';
import InvalidUniversalApplicationRoute from '@/app/app/[...invalidUniversalPath]/page';
import UniversalApplicationUnavailablePage from '@/app/app/unavailable/page';
import { I18nProvider } from '@/i18n/i18n-provider';
import { UniversalBootstrapRoute } from './presentation/bootstrap-route';
import { universalApplicationRoutes, universalApplicationRouteValues } from './routes';

const { redirectSpy, replaceSpy } = vi.hoisted(() => ({
  redirectSpy: vi.fn(),
  replaceSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectSpy,
  useRouter: () => ({ replace: replaceSpy }),
}));

describe('Universal Application routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('uses namespaced routes inside the single apps/web shell', () => {
    expect(universalApplicationRoutes).toEqual({
      root: '/app',
      connect: '/app/connect',
      unavailable: '/app/unavailable',
    });
    expect(
      universalApplicationRouteValues.every((route) => !route.includes('coffee')),
    ).toBe(true);
  });

  it('starts bootstrap and redirects to the environment-code route', async () => {
    render(
      <I18nProvider>
        <UniversalBootstrapRoute />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Запуск приложения' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith(universalApplicationRoutes.connect),
    );
  });

  it('renders the connection route', async () => {
    window.localStorage.setItem(
      'barakasb.local.coffee.environments.v1',
      JSON.stringify([
        {
          schemaVersion: 1,
          businessEnvironmentCode: '1234567890123456',
          project: { id: 'coffee-1' },
        },
      ]),
    );
    const page = await UniversalApplicationConnectPage({
      searchParams: Promise.resolve({}),
    });
    render(<I18nProvider>{page}</I18nProvider>);

    expect(
      await screen.findByRole('heading', { name: 'Подключение к бизнес-среде' }),
    ).toBeInTheDocument();
  });

  it('renders a neutral unavailable route', () => {
    render(
      <I18nProvider>
        <UniversalApplicationUnavailablePage />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Приложение временно недоступно' }),
    ).toBeInTheDocument();
  });

  it('returns an unknown Universal Application route to the safe root', () => {
    InvalidUniversalApplicationRoute();
    expect(redirectSpy).toHaveBeenCalledWith(universalApplicationRoutes.root);
  });
});
