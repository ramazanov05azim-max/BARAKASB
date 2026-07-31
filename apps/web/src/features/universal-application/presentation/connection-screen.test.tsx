import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import { ConnectionScreen } from './connection-screen';
import { UniversalApplicationShell } from './universal-application-shell';

function renderConnectionScreen() {
  return render(
    <I18nProvider>
      <UniversalApplicationShell>
        <ConnectionScreen />
      </UniversalApplicationShell>
    </I18nProvider>,
  );
}

describe('ConnectionScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the start screen, brand, application name, label, and version', () => {
    renderConnectionScreen();

    expect(
      screen.getByRole('heading', { name: 'Подключение к бизнес-среде' }),
    ).toBeInTheDocument();
    expect(screen.getByText('BARAKASB')).toBeInTheDocument();
    expect(screen.getByText('Универсальное приложение')).toBeInTheDocument();
    expect(screen.getByLabelText('Код бизнес-среды')).toBeInTheDocument();
    expect(screen.getByText('Версия 0.1.0')).toBeInTheDocument();
  });

  it('accepts digits, removes letters, and formats groups of four', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '12ab3456cd7890' } });

    expect(input).toHaveValue('1234 5678 90');
  });

  it('normalizes a pasted formatted code and limits it to sixteen digits', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    fireEvent.change(input, {
      target: { value: '1234-5678 9012-3456-9999' },
    });

    expect(input).toHaveValue('1234 5678 9012 3456');
  });

  it('keeps continue disabled for an incomplete code', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '1234' } });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Введите все 16 цифр кода.');
  });

  it('enables continue for a complete code', () => {
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    fireEvent.change(input, { target: { value: '1234567890123456' } });

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not connect or persist and shows the Stage 7.1 neutral state', async () => {
    const user = userEvent.setup();
    renderConnectionScreen();
    const input = screen.getByLabelText('Код бизнес-среды');

    await user.type(input, '1234567890123456');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Разрешение бизнес-среды будет подключено на следующем этапе.',
    );
    expect(window.localStorage.length).toBe(0);
    expect(window.location.pathname).toBe('/');
  });

  it('never writes the Business Environment Code to console', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderConnectionScreen();

    await user.type(screen.getByLabelText('Код бизнес-среды'), '1234567890123456');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('supports logical keyboard navigation', async () => {
    const user = userEvent.setup();
    renderConnectionScreen();

    await user.tab();
    expect(screen.getByRole('link', { name: 'BARAKASB — на главную' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Язык интерфейса')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Код бизнес-среды')).toHaveFocus();
  });
});
