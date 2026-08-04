import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import { coffeeCrashTestProjectId } from './coffee-manager-setup-repository';
import { CoffeeCrashTestRefreshAction } from './coffee-crash-test-refresh-action';
import type { CoffeeCrashTestService } from './coffee-crash-test-service';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

function service(): CoffeeCrashTestService {
  return {
    inspect: vi.fn(),
    resetAndInstall: vi.fn(),
    delete: vi.fn(),
  } as CoffeeCrashTestService;
}

describe('CoffeeCrashTestRefreshAction', () => {
  it('is not exposed outside development', () => {
    render(
      <I18nProvider>
        <CoffeeCrashTestRefreshAction service={service()} development={false} />
      </I18nProvider>,
    );

    expect(
      screen.queryByRole('button', {
        name: 'Обновить тестовое окружение',
      }),
    ).not.toBeInTheDocument();
  });

  it('resets seed version 5 and navigates to the canonical project', async () => {
    const repository = service();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <CoffeeCrashTestRefreshAction service={repository} development />
      </I18nProvider>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Обновить тестовое окружение',
      }),
    );

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('DEV ONLY'));
    expect(repository.resetAndInstall).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(
      `/projects/${coffeeCrashTestProjectId}?crashTestInstalled=1`,
    );
    expect(refresh).toHaveBeenCalledOnce();
  });
});
