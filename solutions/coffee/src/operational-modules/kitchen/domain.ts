import type {
  PreparationPositionStatus,
  PreparationRuntimeContext,
} from '../../order-preparation/contracts';

export type KitchenRuntimeContext = PreparationRuntimeContext;
export type KitchenView = 'NEW' | 'PREPARING' | 'READY' | 'HISTORY';
export type KitchenSort = 'TIME' | 'TABLE';

export interface KitchenPosition {
  readonly orderItemId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly modifiers: ReadonlyArray<{
    readonly groupName: string;
    readonly optionName: string;
  }>;
  readonly comment: string;
  readonly status: PreparationPositionStatus;
  readonly instructionStatus: 'AVAILABLE' | 'EMPTY' | 'UNAVAILABLE';
  readonly instruction: string;
  readonly preparationStartedAt: string | null;
  readonly readyAt: string | null;
  readonly responsibleEmployeeNames: ReadonlyArray<string>;
}

export interface KitchenTicket {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly destination: string;
  readonly sentByEmployeeName: string | null;
  readonly sentAt: string;
  readonly orderActive: boolean;
  readonly completionConfirmed: boolean;
  readonly positions: ReadonlyArray<KitchenPosition>;
}

export interface KitchenState {
  readonly locationName: string | null;
  readonly sourceWarehouseName: string | null;
  readonly sourceWarehouseConfigured: boolean;
  readonly timing: {
    readonly delayedMinutes: number;
    readonly criticalMinutes: number;
  } | null;
  readonly tickets: ReadonlyArray<KitchenTicket>;
}
