// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KitchenState } from './domain';
import { CoffeeKitchenWorkspaceScreen } from './screen';
import type { CoffeeKitchenService } from './service';

const context = {
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  workspaceId: 'workspace-kitchen',
  employeeId: 'employee-kitchen',
};

afterEach(cleanup);

const state: KitchenState = {
  locationName: 'Производственная зона',
  sourceWarehouseName: 'Кухонный запас',
  sourceWarehouseConfigured: true,
  timing: { delayedMinutes: 10, criticalMinutes: 20 },
  tickets: [
    {
      orderId: 'order-1',
      orderNumber: 'Б-0017',
      destination: 'Стол 5',
      sentByEmployeeName: 'Анна Лукина',
      sentAt: new Date(Date.now() - 7 * 60_000).toISOString(),
      orderActive: true,
      completionConfirmed: false,
      positions: [
        {
          orderItemId: 'item-new',
          productName: 'Круассан с ветчиной',
          quantity: 2,
          modifiers: [{ groupName: 'Состав', optionName: 'Без томата' }],
          comment: 'Без перца',
          status: 'NEW',
          instructionStatus: 'AVAILABLE',
          instruction: 'Разогреть перед подачей.',
          preparationStartedAt: null,
          readyAt: null,
          responsibleEmployeeNames: [],
        },
      ],
    },
  ],
};

function service(value = state): CoffeeKitchenService {
  return {
    load: vi.fn(async () => value),
    acceptPosition: vi.fn(async () => undefined),
    markPositionReady: vi.fn(async () => undefined),
    acceptAll: vi.fn(async () => undefined),
    confirmAllReady: vi.fn(async () => undefined),
    subscribe: vi.fn(() => () => undefined),
  };
}

describe('Coffee Kitchen screen', () => {
  it('renders a compact Russian ticket with modifiers, comment, instruction and both bulk actions', async () => {
    render(<CoffeeKitchenWorkspaceScreen context={context} service={service()} />);
    const ticket = await screen.findByRole('heading', { name: 'Стол 5' });
    const card = ticket.closest('article');
    expect(card).not.toBeNull();
    const ticketScreen = within(card!);
    expect(ticketScreen.getByText('Б-0017')).toBeInTheDocument();
    expect(ticketScreen.getByText(/Круассан с ветчиной/)).toHaveTextContent('×2');
    expect(ticketScreen.getByText('+ Без томата')).toBeInTheDocument();
    expect(ticketScreen.getByText(/Без перца/)).toBeInTheDocument();
    expect(ticketScreen.getByText('Инструкция')).toBeInTheDocument();
    expect(ticketScreen.getByRole('button', { name: 'Принять' })).toBeEnabled();
    expect(ticketScreen.getByRole('button', { name: 'Принять всё' })).toBeEnabled();
    expect(ticketScreen.getByRole('button', { name: 'Всё готово' })).toBeDisabled();
    expect(screen.queryByText('Следующий статус')).not.toBeInTheDocument();
    expect(screen.queryByText('Принят')).not.toBeInTheDocument();
  });

  it('executes item accept and bulk actions through the Kitchen application service', async () => {
    const user = userEvent.setup();
    const moduleService = service();
    render(<CoffeeKitchenWorkspaceScreen context={context} service={moduleService} />);
    await user.click(await screen.findByRole('button', { name: 'Принять' }));
    await waitFor(() =>
      expect(moduleService.acceptPosition).toHaveBeenCalledWith(
        context,
        'order-1',
        'item-new',
      ),
    );
  });

  it('shows ready status without an item action and enables ready-all', async () => {
    const readyState: KitchenState = {
      ...state,
      tickets: [
        {
          ...state.tickets[0]!,
          positions: [
            {
              ...state.tickets[0]!.positions[0]!,
              status: 'READY',
              readyAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };
    render(
      <CoffeeKitchenWorkspaceScreen context={context} service={service(readyState)} />,
    );
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Готовые · 1' }));
    expect(screen.getByText('Готов')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Готов' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Принять всё' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Всё готово' })).toBeEnabled();
  });

  it('degrades safely when the queue source is unavailable', async () => {
    const failed = service();
    vi.mocked(failed.load).mockRejectedValue(new Error('offline'));
    render(<CoffeeKitchenWorkspaceScreen context={context} service={failed} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось загрузить очередь',
    );
  });

  it('keeps owner preview read-only', async () => {
    render(
      <CoffeeKitchenWorkspaceScreen
        context={{ ...context, employeeId: 'owner-preview' }}
        service={service()}
      />,
    );
    expect(await screen.findByText(/Предпросмотр владельца/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Принять' })).toBeDisabled();
  });
});
