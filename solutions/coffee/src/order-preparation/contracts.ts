export type PreparationPositionStatus = 'NEW' | 'PREPARING' | 'READY';

export interface PreparationRuntimeContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface PreparationModifierView {
  readonly groupName: string;
  readonly optionName: string;
}

export interface PreparationPositionView {
  readonly orderItemId: string;
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly modifiers: ReadonlyArray<PreparationModifierView>;
  readonly comment: string;
  readonly status: PreparationPositionStatus;
  readonly sentAt: string;
  readonly preparationStartedAt: string | null;
  readonly readyAt: string | null;
  readonly responsibleEmployeeNames: ReadonlyArray<string>;
}

export interface PreparationTicketView {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly destination: string;
  readonly sentByEmployeeName: string | null;
  readonly sentAt: string;
  readonly orderActive: boolean;
  readonly completionConfirmed: boolean;
  readonly positions: ReadonlyArray<PreparationPositionView>;
}

export interface PreparationQueueReadModel {
  readonly locationName: string | null;
  readonly sourceWarehouseName: string | null;
  readonly sourceWarehouseConfigured: boolean;
  readonly timing: {
    readonly delayedMinutes: number;
    readonly criticalMinutes: number;
  } | null;
  readonly tickets: ReadonlyArray<PreparationTicketView>;
}

export interface PreparationQueueQueryService {
  loadKitchenQueue(
    context: PreparationRuntimeContext,
  ): Promise<PreparationQueueReadModel>;
  subscribe(context: PreparationRuntimeContext, listener: () => void): () => void;
}

export interface PreparationCommandService {
  acceptPosition(
    context: PreparationRuntimeContext,
    orderId: string,
    orderItemId: string,
  ): Promise<void>;
  markPositionReady(
    context: PreparationRuntimeContext,
    orderId: string,
    orderItemId: string,
  ): Promise<void>;
  acceptAll(context: PreparationRuntimeContext, orderId: string): Promise<void>;
  confirmAllReady(context: PreparationRuntimeContext, orderId: string): Promise<void>;
}

export type PreparationService = PreparationQueueQueryService &
  PreparationCommandService;

export class PreparationOperationError extends Error {
  constructor(
    public readonly code:
      | 'ACCESS_DENIED'
      | 'NOT_FOUND'
      | 'ORDER_INACTIVE'
      | 'INVALID_TRANSITION'
      | 'NOT_ALL_READY'
      | 'READ_ONLY_PREVIEW',
  ) {
    super(code);
    this.name = 'PreparationOperationError';
  }
}
