// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeOrder,
} from './bar-domain';
import type { CoffeeBarService } from './bar-service';
import { CoffeeBarWorkspaceScreen } from './bar-workspace-screen';

(globalThis as typeof globalThis & { React: typeof React }).React = React;
afterEach(cleanup);

const timestamp = '2026-07-31T12:00:00.000Z';
const context: CoffeeBarRuntimeContext = {
  projectId: 'project',
  businessEnvironmentId: 'environment',
  workspaceId: 'workspace-bar',
  employeeId: 'employee',
};
const order: CoffeeOrder = {
  orderId: 'order-1',
  projectId: context.projectId,
  businessEnvironmentId: context.businessEnvironmentId,
  workspaceId: context.workspaceId,
  locationId: 'location',
  orderType: 'TABLE',
  tableId: 'table-1',
  orderNumber: 'Б-0001',
  status: 'DRAFT',
  guestCount: 1,
  seatingNote: '',
  openedAt: timestamp,
  openedByEmployeeId: context.employeeId,
  createdAt: timestamp,
  createdByEmployeeId: context.employeeId,
  paymentStatus: 'UNPAID',
  paymentMethod: null,
  paidAmount: null,
  paidAt: null,
  paidByEmployeeId: null,
  total: 0,
  issuedAt: null,
  completedAt: null,
  completedByEmployeeId: null,
  cancellationReason: null,
  updatedAt: timestamp,
  items: [],
  batches: [],
};
const state: CoffeeBarState = {
  establishmentName: 'Тестовая кофейня',
  locationId: 'location',
  locationName: 'Основная точка',
  employeeId: context.employeeId,
  employeeName: 'Иван Беляев',
  zones: [{ id: 'zone', name: 'Основной зал', canvasWidth: 800, canvasHeight: 500 }],
  tables: [
    {
      id: 'table-1',
      zoneId: 'zone',
      name: 'Стол 1',
      code: 'T-01',
      seatCount: 2,
      shape: 'ROUND',
      positionX: 50,
      positionY: 50,
      width: 90,
      height: 90,
      rotation: 0,
      status: 'FREE',
      activeOrderId: null,
    },
  ],
  categories: [{ id: 'coffee', name: 'Кофе' }],
  products: [
    {
      id: 'espresso',
      name: 'Эспрессо',
      categoryId: 'coffee',
      price: 190,
      currency: 'RUB',
      modifierGroupIds: [],
    },
  ],
  modifierGroups: [],
  orders: [],
};

function serviceFixture(): CoffeeBarService {
  return {
    load: vi.fn(async () => structuredClone(state)),
    createTableOrder: vi.fn(async () => structuredClone(order)),
    createUnassignedOrder: vi.fn(async () =>
      structuredClone({
        ...order,
        orderType: 'UNASSIGNED' as const,
        tableId: null,
      }),
    ),
    createTakeawayOrder: vi.fn(async () =>
      structuredClone({
        ...order,
        orderType: 'TAKEAWAY' as const,
        tableId: null,
      }),
    ),
    assignOrder: vi.fn(async () => structuredClone(order)),
    changeGuestCount: vi.fn(async () => structuredClone(order)),
    transferOrder: vi.fn(async () => structuredClone(order)),
    releaseTable: vi.fn(async () => undefined),
    addItem: vi.fn(async () => structuredClone(order)),
    updateItemQuantity: vi.fn(async () => structuredClone(order)),
    updateItemDetails: vi.fn(async () => structuredClone(order)),
    removeItem: vi.fn(async () => structuredClone(order)),
    sendOrder: vi.fn(async () => structuredClone(order)),
    updateBarItemStatus: vi.fn(async () => structuredClone(order)),
    recordPayment: vi.fn(async () => structuredClone(order)),
    completeOrder: vi.fn(async () => structuredClone(order)),
    cancelOrder: vi.fn(async () => structuredClone(order)),
    subscribe: vi.fn(() => () => undefined),
  };
}

describe('Coffee Bar operator navigation', () => {
  it('shows only the floor plan in the Hall screen and opens a free table directly', async () => {
    const service = serviceFixture();
    const user = userEvent.setup();
    render(
      <CoffeeBarWorkspaceScreen
        context={context}
        accessCode="6728 0175 1693"
        service={service}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'План зала' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Меню' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Стол 1/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Стол 1: Свободен/ }));
    expect(service.createTableOrder).toHaveBeenCalledWith(context, 'table-1', {
      guestCount: 1,
    });
    expect(await screen.findByRole('heading', { name: 'Меню' })).toBeTruthy();
  });

  it('creates an unassigned order before selecting a destination', async () => {
    const service = serviceFixture();
    const user = userEvent.setup();
    render(
      <CoffeeBarWorkspaceScreen
        context={context}
        accessCode="6728 0175 1693"
        service={service}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Новый заказ' }));
    await waitFor(() =>
      expect(service.createUnassignedOrder).toHaveBeenCalledWith(context),
    );
    expect(await screen.findByRole('heading', { name: 'Меню' })).toBeTruthy();
  });

  it('exposes the separate operational journal and its required filters', async () => {
    const user = userEvent.setup();
    render(
      <CoffeeBarWorkspaceScreen
        context={context}
        accessCode="6728 0175 1693"
        service={serviceFixture()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Заказы' }));
    expect(screen.getByRole('heading', { name: 'Журнал заказов' })).toBeTruthy();
    for (const label of [
      'Все',
      'Активные',
      'Навынос',
      'Доставка',
      'Готовые',
      'Завершённые',
      'Отменённые',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });
});
