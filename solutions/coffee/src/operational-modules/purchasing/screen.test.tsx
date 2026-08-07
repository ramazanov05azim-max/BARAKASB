// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PurchaserState } from './domain';
import type { CoffeePurchaserService } from './service';
import { CoffeePurchaserWorkspaceScreen } from './screen';

const resource = {
  resourceId: 'raw-resource-id',
  resourceType: 'ingredient' as const,
  name: 'Кофе зерновой',
  accountingType: 'weight' as const,
  baseUnit: 'g' as const,
  baseUnitId: 'unit-g',
  purchaseUnitId: 'unit-package',
  purchasePackageSize: 1000,
  minimumStockBase: 2000,
  active: true,
};
const state: PurchaserState = {
  employeeName: 'Сергей Котов',
  employees: [{ id: 'employee-1', name: 'Сергей Котов' }],
  warehouses: [{ id: 'raw-warehouse-id', name: 'Основной склад' }],
  suppliers: [
    {
      id: 'raw-supplier-id',
      name: 'Северное зерно',
      contactPerson: 'Анна',
      phone: '+7 900 000-00-00',
      email: 'coffee@example.test',
      address: '',
      taxIdentifier: '',
      paymentTerms: '',
      deliverySchedule: '',
      suppliedIngredients: '',
      status: 'active',
      updatedAt: '2026-08-07T10:00:00.000Z',
    },
  ],
  resources: [resource],
  needs: [
    {
      warehouseId: 'raw-warehouse-id',
      warehouseName: 'Основной склад',
      resource,
      balance: {
        warehouseId: 'raw-warehouse-id',
        resource,
        quantityBase: 500,
        lastMovementAt: null,
        status: 'LOW',
      },
      thresholdBase: 2000,
      recommendedQuantityBase: 1500,
      state: 'BELOW_MINIMUM',
      preferredSupplier: null,
      lastPrice: null,
      barcode: '460000000001',
    },
  ],
  assortments: [],
  orders: [],
  deliveries: [],
  priceHistory: [],
  warnings: [],
};

const service: CoffeePurchaserService = {
  load: vi.fn(async () => state),
  queryOperations: vi.fn(async () => ({
    needs: [],
    orders: [],
    deliveries: [],
    configurationWarnings: [],
  })),
  createOrder: vi.fn(),
  updateDraftOrder: vi.fn(),
  sendOrder: vi.fn(),
  cancelOrder: vi.fn(),
  createDeliveryDraft: vi.fn(),
  postDelivery: vi.fn(),
  cancelDelivery: vi.fn(),
  saveSupplier: vi.fn(async () => undefined),
  deleteSupplier: vi.fn(async () => undefined),
  saveAssortment: vi.fn(async () => undefined),
  removeAssortment: vi.fn(async () => undefined),
  subscribe: vi.fn(() => () => undefined),
};

describe('CoffeePurchaserWorkspaceScreen', () => {
  it('opens all five Russian sections, supports barcode search and hides raw IDs', async () => {
    const user = userEvent.setup();
    render(
      <CoffeePurchaserWorkspaceScreen
        context={{
          projectId: 'project-1',
          businessEnvironmentId: 'environment-1',
          workspaceId: 'workspace-1',
          employeeId: 'employee-1',
        }}
        service={service}
      />,
    );
    expect(await screen.findByText('Кофе зерновой')).not.toBeNull();
    const search = screen.getByLabelText('Поиск по названию или штрихкоду');
    await user.type(search, '460000000001');
    expect(screen.getByText('Кофе зерновой')).not.toBeNull();
    for (const [button, heading] of [
      ['Заказы поставщикам', 'Заказы поставщикам'],
      ['Поставки', 'Поставки'],
      ['Поставщики', 'Поставщики'],
      ['История', 'История'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: button }));
      expect(screen.getByRole('heading', { name: heading })).not.toBeNull();
    }
    expect(screen.queryByText('raw-resource-id')).toBeNull();
    expect(screen.queryByText('raw-warehouse-id')).toBeNull();
    expect(screen.queryByText('raw-supplier-id')).toBeNull();
  });
});
