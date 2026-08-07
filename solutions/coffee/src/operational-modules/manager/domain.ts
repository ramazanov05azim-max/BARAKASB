export type ManagerSection =
  'overview' | 'purchasing' | 'warehouse' | 'events' | 'warnings';

export type ManagerWarningSeverity = 'info' | 'warning' | 'critical';

export interface ManagerRuntimeContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface ManagerNavigationTarget {
  readonly moduleId: 'warehouse' | 'purchasing';
  readonly workspaceId: string | null;
  readonly section: string;
  readonly entityId: string | null;
}

export interface ManagerWarning {
  readonly warningId: string;
  readonly severity: ManagerWarningSeverity;
  readonly source: 'warehouse' | 'purchasing';
  readonly entityId: string;
  readonly message: string;
  readonly suggestedAction: string;
  readonly navigationTarget: ManagerNavigationTarget | null;
}

export interface ManagerEvent {
  readonly eventId: string;
  readonly timestamp: string;
  readonly type: string;
  readonly source: 'warehouse' | 'purchasing';
  readonly description: string;
  readonly entityId: string | null;
  readonly navigationTarget: ManagerNavigationTarget | null;
}

export interface ManagerWorkspaceReadModel {
  readonly employeeName: string;
  readonly salesKpis: {
    readonly revenueToday: number | null;
    readonly receiptCountToday: number | null;
    readonly averageReceiptToday: number | null;
    readonly currency: string;
  };
  readonly warehouseSummary: {
    readonly totalResources: number;
    readonly belowMinimum: number;
    readonly outOfStock: number;
    readonly negative: number;
    readonly withoutThreshold: number;
  };
  readonly purchasingSummary: {
    readonly drafts: number;
    readonly sent: number;
    readonly partiallyDelivered: number;
    readonly delivered: number;
    readonly cancelled: number;
    readonly overdue: number;
    readonly active: number;
  };
  readonly purchasing: {
    readonly orders: PurchasingOperationsReadModel['orders'];
    readonly deliveries: PurchasingOperationsReadModel['deliveries'];
    readonly needs: PurchasingOperationsReadModel['needs'];
  };
  readonly warehouse: WarehouseOperationsReadModel;
  readonly warnings: ReadonlyArray<ManagerWarning>;
  readonly events: ReadonlyArray<ManagerEvent>;
  readonly generatedAt: string;
}

export interface ManagerPreferences {
  readonly schemaVersion: 1;
  readonly selectedSection: ManagerSection;
  readonly warningsOnly: boolean;
  readonly hiddenPanelKeys: ReadonlyArray<string>;
}
import type { PurchasingOperationsReadModel } from '../purchasing/service';
import type { WarehouseOperationsReadModel } from '../warehouse/service';
