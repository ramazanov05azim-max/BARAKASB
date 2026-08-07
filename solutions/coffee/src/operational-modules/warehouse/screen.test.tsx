// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WarehouseInventoryDocument, WarehouseState } from './domain';
import type { CoffeeWarehouseService } from './service';
import { CoffeeWarehouseWorkspaceScreen } from './screen';

const state: WarehouseState = {
  employeeName: 'Сергей Котов',
  employees: [{ id: 'employee-1', name: 'Сергей Котов' }],
  warehouses: [{ id: 'raw-warehouse-id', name: 'Основной склад' }],
  resources: [
    {
      resourceId: 'raw-resource-id',
      resourceType: 'ingredient',
      name: 'Кофе в зёрнах',
      accountingType: 'weight',
      baseUnit: 'g',
      baseUnitId: 'unit-g',
      purchaseUnitId: 'unit-kg',
      purchasePackageSize: 1,
      minimumStockBase: 100,
      active: true,
    },
  ],
  balances: [
    {
      warehouseId: 'raw-warehouse-id',
      resource: {
        resourceId: 'raw-resource-id',
        resourceType: 'ingredient',
        name: 'Кофе в зёрнах',
        accountingType: 'weight',
        baseUnit: 'g',
        baseUnitId: 'unit-g',
        purchaseUnitId: 'unit-kg',
        purchasePackageSize: 1,
        minimumStockBase: 100,
        active: true,
      },
      quantityBase: 1250,
      lastMovementAt: null,
      status: 'IN_STOCK',
    },
  ],
  movements: [],
  inventories: [],
  issues: [],
};

const inventoryDocument: WarehouseInventoryDocument = {
  inventoryId: 'inventory',
  warehouseId: 'raw-warehouse-id',
  status: 'DRAFT',
  createdAt: '',
  createdBy: '',
  postedAt: null,
  postedBy: null,
  lines: [],
  comment: '',
};

const service: CoffeeWarehouseService = {
  load: vi.fn(async () => state),
  recordOpeningBalance: vi.fn(async () => undefined),
  recordReceipt: vi.fn(async () => undefined),
  recordWriteOff: vi.fn(async () => undefined),
  transfer: vi.fn(async () => undefined),
  createInventory: vi.fn(async () => inventoryDocument),
  updateInventoryLine: vi.fn(async () => inventoryDocument),
  postInventory: vi.fn(async () => undefined),
  consumeCompletedOrder: vi.fn(async () => undefined),
  recordSupplierDelivery: vi.fn(async () => undefined),
  queryOperations: vi.fn(async () => ({
    warehouses: [],
    resources: [],
    balances: [],
    recentMovements: [],
    issues: [],
  })),
  subscribe: vi.fn(() => () => undefined),
};

describe('CoffeeWarehouseWorkspaceScreen', () => {
  it('opens all six Russian sections and displays converted readable balances', async () => {
    const user = userEvent.setup();
    render(
      <CoffeeWarehouseWorkspaceScreen
        context={{
          projectId: 'p1',
          businessEnvironmentId: 'e1',
          workspaceId: 'w1',
          employeeId: 'employee-1',
        }}
        service={service}
      />,
    );
    expect(await screen.findByText('1,25 кг')).not.toBeNull();
    for (const [button, heading] of [
      ['Приход', 'Принять на склад'],
      ['Списание', 'Списание'],
      ['Перемещение', 'Перемещение'],
      ['Инвентаризация', 'Инвентаризация'],
      ['История', 'История'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: button }));
      expect(screen.getByRole('heading', { name: heading })).not.toBeNull();
    }
    expect(screen.queryByText('raw-resource-id')).toBeNull();
    expect(screen.queryByText('raw-warehouse-id')).toBeNull();
  });
});
