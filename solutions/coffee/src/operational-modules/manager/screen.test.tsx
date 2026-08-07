// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoffeeManagerWorkspaceService, ManagerWorkspaceState } from './service';
import { CoffeeManagerWorkspaceScreen } from './screen';

afterEach(cleanup);

const state: ManagerWorkspaceState = {
  preferences: {
    schemaVersion: 1,
    selectedSection: 'overview',
    warningsOnly: false,
    hiddenPanelKeys: [],
  },
  readModel: {
    employeeName: 'Анна',
    salesKpis: {
      revenueToday: null,
      receiptCountToday: null,
      averageReceiptToday: null,
      currency: 'RUB',
    },
    warehouseSummary: {
      totalResources: 0,
      belowMinimum: 0,
      outOfStock: 0,
      negative: 0,
      withoutThreshold: 0,
    },
    purchasingSummary: {
      drafts: 0,
      sent: 0,
      partiallyDelivered: 0,
      delivered: 0,
      cancelled: 0,
      overdue: 0,
      active: 0,
    },
    purchasing: { needs: [], orders: [], deliveries: [] },
    warehouse: { warehouses: [], balances: [], recentMovements: [], issues: [] },
    warnings: [],
    events: [],
    generatedAt: '2026-08-07T12:00:00.000Z',
  },
};

function service(): CoffeeManagerWorkspaceService {
  return {
    load: vi.fn(async () => structuredClone(state)),
    savePreferences: vi.fn(async (_context, preferences) => preferences),
    subscribe: vi.fn(() => () => undefined),
  };
}

describe('CoffeeManagerWorkspaceScreen', () => {
  it('shows computed empty states instead of invented KPI values', async () => {
    render(
      <CoffeeManagerWorkspaceScreen
        context={{
          projectId: 'project-1',
          businessEnvironmentId: 'environment-1',
          workspaceId: 'workspace-manager',
          employeeId: 'employee-1',
        }}
        service={service()}
      />,
    );
    expect(await screen.findAllByText('Нет данных')).toHaveLength(3);
    expect(screen.getByText('Актуальных предупреждений нет.')).toBeInTheDocument();
    expect(screen.queryByText('environment-1')).not.toBeInTheDocument();
  });

  it('opens all five Russian read-only sections and persists the selected tab', async () => {
    const user = userEvent.setup();
    const moduleService = service();
    render(
      <CoffeeManagerWorkspaceScreen
        context={{
          projectId: 'project-1',
          businessEnvironmentId: 'environment-1',
          workspaceId: 'workspace-manager',
          employeeId: 'employee-1',
        }}
        service={moduleService}
      />,
    );
    await screen.findByText('Выручка сегодня');
    for (const label of [
      'Обзор',
      'Контроль закупок',
      'Контроль склада',
      'События',
      'Предупреждения',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: 'Контроль склада' }));
    expect(
      await screen.findByText('Складские остатки пока не настроены.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(moduleService.savePreferences).toHaveBeenCalledOnce());
  });

  it('renders an owner-preview navigation target without exposing write actions', async () => {
    const warningState: ManagerWorkspaceState = {
      ...state,
      readModel: {
        ...state.readModel,
        warnings: [
          {
            warningId: 'warning-1',
            severity: 'critical',
            source: 'warehouse',
            entityId: 'resource-1',
            message: 'Зерно: нет в наличии.',
            suggestedAction: 'Откройте склад.',
            navigationTarget: {
              moduleId: 'warehouse',
              workspaceId: 'workspace-warehouse',
              section: 'balances',
              entityId: 'resource-1',
            },
          },
        ],
      },
    };
    const moduleService = service();
    vi.mocked(moduleService.load).mockResolvedValue(warningState);
    render(
      <CoffeeManagerWorkspaceScreen
        context={{
          projectId: 'project-1',
          businessEnvironmentId: 'environment-1',
          workspaceId: 'workspace-manager',
          employeeId: 'owner-preview',
        }}
        service={moduleService}
      />,
    );
    const link = await screen.findByRole('link', {
      name: 'Открыть рабочее пространство',
    });
    expect(link).toHaveAttribute(
      'href',
      '/projects/project-1/admin/solutions/coffee/workspaces/workspace-warehouse/open',
    );
    expect(
      screen.queryByRole('button', { name: /провести|списать|изменить/i }),
    ).toBeNull();
  });
});
