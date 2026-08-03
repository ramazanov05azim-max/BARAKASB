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
      modifierGroupIds: ['volume', 'espresso-additional'],
    },
    {
      id: 'croissant',
      name: 'Круассан',
      categoryId: 'coffee',
      price: 230,
      currency: 'RUB',
      modifierGroupIds: [],
    },
  ],
  modifierGroups: [
    {
      id: 'volume',
      name: 'Объём',
      purpose: 'configuration',
      selectionType: 'single',
      required: true,
      minimumSelections: 1,
      maximumSelections: 1,
      defaultOptionName: null,
      options: [
        { name: '30 мл', priceAdjustment: 0 },
        { name: '60 мл', priceAdjustment: 90 },
      ],
    },
    {
      id: 'espresso-additional',
      name: 'Дополнительно',
      purpose: 'additional',
      selectionType: 'multiple',
      required: false,
      minimumSelections: 0,
      maximumSelections: 2,
      defaultOptionName: null,
      options: [
        { name: 'Сахар', priceAdjustment: 0 },
        { name: 'Корица', priceAdjustment: 0 },
      ],
    },
    {
      id: 'milk',
      name: 'Молоко',
      purpose: 'configuration',
      selectionType: 'single',
      required: false,
      minimumSelections: 0,
      maximumSelections: 1,
      defaultOptionName: null,
      options: [{ name: 'Овсяное', priceAdjustment: 70 }],
    },
  ],
  orders: [],
};

function serviceFixture(initialState: CoffeeBarState = state): CoffeeBarService {
  let currentState = structuredClone(initialState);
  const storeOrder = (nextOrder: CoffeeOrder): CoffeeOrder => {
    currentState = {
      ...currentState,
      orders: [
        ...currentState.orders.filter(
          (candidate) => candidate.orderId !== nextOrder.orderId,
        ),
        nextOrder,
      ],
    };
    return structuredClone(nextOrder);
  };
  return {
    load: vi.fn(async () => structuredClone(currentState)),
    createTableOrder: vi.fn(async () => storeOrder(order)),
    createUnassignedOrder: vi.fn(async () =>
      storeOrder({
        ...order,
        orderType: 'UNASSIGNED' as const,
        tableId: null,
      }),
    ),
    createTakeawayOrder: vi.fn(async () =>
      storeOrder({
        ...order,
        orderType: 'TAKEAWAY' as const,
        tableId: null,
      }),
    ),
    assignOrder: vi.fn(async () => storeOrder(order)),
    changeGuestCount: vi.fn(async () => storeOrder(order)),
    transferOrder: vi.fn(async () => storeOrder(order)),
    releaseTable: vi.fn(async () => undefined),
    addItem: vi.fn(async (_context, orderId, input) => {
      const existing =
        currentState.orders.find((candidate) => candidate.orderId === orderId) ?? order;
      const product = currentState.products.find(
        (candidate) => candidate.id === input.productId,
      )!;
      return storeOrder({
        ...existing,
        total: existing.total + product.price,
        items: [
          ...existing.items,
          {
            id: `item-${existing.items.length + 1}`,
            productId: product.id,
            productName: product.name,
            variantName: null,
            quantity: 1,
            unitPrice: product.price,
            finalUnitPrice: product.price,
            modifiers: [],
            comment: input.comment ?? '',
            preparationWorkspace: 'BAR',
            status: 'DRAFT',
            submittedBatchId: null,
          },
        ],
      });
    }),
    updateItemQuantity: vi.fn(async () => storeOrder(order)),
    updateItemDetails: vi.fn(async () => storeOrder(order)),
    removeItem: vi.fn(async () => storeOrder(order)),
    sendOrder: vi.fn(async () => storeOrder(order)),
    updateBarItemStatus: vi.fn(async () => storeOrder(order)),
    recordPayment: vi.fn(async () => storeOrder(order)),
    completeOrder: vi.fn(async () => storeOrder(order)),
    cancelOrder: vi.fn(async () => storeOrder(order)),
    subscribe: vi.fn(() => () => undefined),
  };
}

describe('Coffee Bar operator navigation', () => {
  it('shows only the floor plan in the Hall screen and opens a free table directly', async () => {
    const service = serviceFixture();
    const user = userEvent.setup();
    render(<CoffeeBarWorkspaceScreen context={context} service={service} />);

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
    render(<CoffeeBarWorkspaceScreen context={context} service={service} />);

    await user.click(await screen.findByRole('button', { name: 'Новый заказ' }));
    await waitFor(() =>
      expect(service.createUnassignedOrder).toHaveBeenCalledWith(context),
    );
    expect(await screen.findByRole('heading', { name: 'Меню' })).toBeTruthy();
  });

  it('exposes the separate operational journal and its required filters', async () => {
    const user = userEvent.setup();
    render(<CoffeeBarWorkspaceScreen context={context} service={serviceFixture()} />);

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
    expect(
      screen.getByRole('button', { name: 'Активные' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('builds the configurator only from groups assigned to the selected product', async () => {
    const service = serviceFixture();
    const user = userEvent.setup();
    render(<CoffeeBarWorkspaceScreen context={context} service={service} />);

    await user.click(await screen.findByRole('button', { name: 'Новый заказ' }));
    await user.click(await screen.findByRole('button', { name: /Эспрессо/ }));

    expect(await screen.findByRole('heading', { name: 'Эспрессо' })).toBeTruthy();
    expect(screen.getByText('Объём')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Дополнительно' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /30 мл/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Сахар/ })).toBeTruthy();
    expect(screen.queryByText('Молоко')).toBeNull();
    expect(screen.queryByLabelText('Вариант')).toBeNull();
  });

  it('adds a simple product immediately without opening the configurator', async () => {
    const service = serviceFixture();
    const user = userEvent.setup();
    render(<CoffeeBarWorkspaceScreen context={context} service={service} />);

    await user.click(await screen.findByRole('button', { name: 'Новый заказ' }));
    await user.click(await screen.findByRole('button', { name: /Круассан/ }));

    await waitFor(() =>
      expect(service.addItem).toHaveBeenCalledWith(context, order.orderId, {
        productId: 'croissant',
      }),
    );
    expect(screen.queryByRole('heading', { name: 'Круассан' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Меню' })).toBeTruthy();
  });

  it('opens the menu from the current order without changing the selected order', async () => {
    const activeState: CoffeeBarState = {
      ...structuredClone(state),
      tables: [
        {
          ...state.tables[0]!,
          status: 'DRAFT',
          activeOrderId: order.orderId,
        },
      ],
      orders: [order],
    };
    const user = userEvent.setup();
    render(
      <CoffeeBarWorkspaceScreen
        context={context}
        service={serviceFixture(activeState)}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: /Стол 1: Новый заказ/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Добавить позиции' }));

    expect(await screen.findByRole('heading', { name: 'Меню' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Б-0001/ })).toBeTruthy();
  });

  it('resets the journal to Active and highlights the opened order with a preview', async () => {
    const previewItems = ['Капучино', 'Круассан', 'Чай', 'Вода'].map(
      (productName, index) => ({
        id: `preview-${index}`,
        productId: `preview-product-${index}`,
        productName,
        variantName: null,
        quantity: index === 0 ? 2 : 1,
        unitPrice: 100,
        finalUnitPrice: 100,
        modifiers: [],
        comment: '',
        preparationWorkspace: 'BAR' as const,
        status: 'DRAFT' as const,
        submittedBatchId: null,
      }),
    );
    const previewOrder: CoffeeOrder = {
      ...order,
      total: 500,
      items: previewItems,
    };
    const journalState: CoffeeBarState = {
      ...structuredClone(state),
      orders: [previewOrder],
    };
    const user = userEvent.setup();
    render(
      <CoffeeBarWorkspaceScreen
        context={context}
        service={serviceFixture(journalState)}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Заказы' }));
    const activeFilter = screen.getByRole('button', { name: 'Активные' });
    expect(activeFilter.getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Все' }));
    expect(
      screen.getByRole('button', { name: 'Все' }).getAttribute('aria-pressed'),
    ).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Меню' }));
    await user.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(
      screen.getByRole('button', { name: 'Активные' }).getAttribute('aria-pressed'),
    ).toBe('true');

    const card = screen.getByRole('button', {
      name: /Стол 1.*Б-0001.*Капучино ×2.*Круассан ×1.*Чай ×1.*ещё 1 позиций/s,
    });
    expect(card.getAttribute('aria-pressed')).toBe('false');
    await user.click(card);
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });
});
