import type { CoffeeTableShape } from './domain';

export type CoffeeOrderType = 'UNASSIGNED' | 'TABLE' | 'TAKEAWAY' | 'DELIVERY';
export type CoffeeOrderStatus =
  'DRAFT' | 'SENT' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type CoffeePaymentStatus = 'UNPAID' | 'PAID';
export type CoffeePaymentMethod = 'CASH' | 'CARD';
export type CoffeePreparationWorkspace = 'BAR' | 'KITCHEN' | 'IMMEDIATE';
export type CoffeeOrderItemStatus =
  'DRAFT' | 'NEW' | 'PREPARING' | 'READY' | 'CANCELLED';
export type CoffeeTableOperationalStatus =
  | 'FREE'
  | 'OCCUPIED'
  | 'DRAFT'
  | 'SENT'
  | 'IN_PREPARATION'
  | 'READY'
  | 'PAID'
  | 'AWAITING_COMPLETION';

export interface CoffeeOrderItemModifier {
  readonly modifierGroupId: string;
  readonly modifierName: string;
  readonly optionName: string;
  readonly priceAdjustment: number;
}

export interface CoffeeStockConsumptionSnapshot {
  readonly recipeId: string | null;
  readonly requirements: ReadonlyArray<{
    readonly resourceId: string;
    readonly resourceType: 'ingredient' | 'preparation' | 'semi-finished' | 'package';
    readonly quantityBasePerItem: number;
    readonly baseUnit: 'g' | 'ml' | 'pc';
  }>;
  readonly issueCode: 'RECIPE_NOT_FOUND' | 'RECIPE_CYCLE' | null;
}

export interface CoffeeOrderItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly variantName: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly finalUnitPrice: number;
  readonly modifiers: ReadonlyArray<CoffeeOrderItemModifier>;
  readonly stockConsumptionSnapshot?: CoffeeStockConsumptionSnapshot;
  readonly comment: string;
  readonly preparationWorkspace: CoffeePreparationWorkspace;
  readonly status: CoffeeOrderItemStatus;
  readonly submittedBatchId: string | null;
  readonly preparationStartedAt?: string | null;
  readonly preparationStartedByEmployeeId?: string | null;
  readonly readyAt?: string | null;
  readonly readyByEmployeeId?: string | null;
  readonly issuedAt: string | null;
  readonly issuedByEmployeeId: string | null;
}

export interface CoffeeOrderBatch {
  readonly batchId: string;
  readonly orderId: string;
  readonly createdAt: string;
  readonly createdByEmployeeId: string;
  readonly itemIds: ReadonlyArray<string>;
  readonly sentAt: string;
  readonly status: 'SENT';
}

export interface CoffeeOrder {
  readonly orderId: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly locationId: string;
  readonly orderType: CoffeeOrderType;
  readonly tableId: string | null;
  readonly orderNumber: string;
  readonly status: CoffeeOrderStatus;
  readonly guestCount: number;
  readonly seatingNote: string;
  readonly openedAt: string;
  readonly openedByEmployeeId: string;
  readonly createdAt: string;
  readonly createdByEmployeeId: string;
  readonly paymentStatus: CoffeePaymentStatus;
  readonly paymentMethod: CoffeePaymentMethod | null;
  readonly paidAmount: number | null;
  readonly paidAt: string | null;
  readonly paidByEmployeeId: string | null;
  readonly total: number;
  readonly issuedAt: string | null;
  readonly completedAt: string | null;
  readonly completedByEmployeeId: string | null;
  readonly cancellationReason: string | null;
  readonly updatedAt: string;
  readonly items: ReadonlyArray<CoffeeOrderItem>;
  readonly batches: ReadonlyArray<CoffeeOrderBatch>;
}

export interface CoffeeBarAuditEntry {
  readonly id: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly orderId: string;
  readonly employeeId: string;
  readonly operation:
    | 'ORDER_CREATED'
    | 'ORDER_ASSIGNED'
    | 'GUEST_COUNT_CHANGED'
    | 'ORDER_TRANSFERRED'
    | 'ORDER_RELEASED'
    | 'BATCH_SENT'
    | 'ITEMS_ACCEPTED'
    | 'ITEM_STATUS_CHANGED'
    | 'ACCEPT_POSITION'
    | 'READY_POSITION'
    | 'ACCEPT_ALL'
    | 'READY_ALL'
    | 'PAYMENT_RECORDED'
    | 'ORDER_ISSUED'
    | 'ORDER_COMPLETED'
    | 'ORDER_CANCELLED';
  readonly occurredAt: string;
  readonly detail: string | null;
}

export interface CoffeeBarStore {
  readonly orders: ReadonlyArray<CoffeeOrder>;
  readonly audit: ReadonlyArray<CoffeeBarAuditEntry>;
}

export interface CoffeeBarRuntimeContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface CoffeeBarZoneView {
  readonly id: string;
  readonly name: string;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
}

export interface CoffeeBarTableView {
  readonly id: string;
  readonly zoneId: string;
  readonly name: string;
  readonly code: string;
  readonly seatCount: number;
  readonly shape: CoffeeTableShape;
  readonly positionX: number;
  readonly positionY: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly status: CoffeeTableOperationalStatus;
  readonly activeOrderId: string | null;
}

export interface CoffeeBarState {
  readonly establishmentName: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly zones: ReadonlyArray<CoffeeBarZoneView>;
  readonly tables: ReadonlyArray<CoffeeBarTableView>;
  readonly categories: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly products: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly categoryId: string;
    readonly price: number;
    readonly currency: string;
    readonly modifierGroupIds: ReadonlyArray<string>;
  }>;
  readonly modifierGroups: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly purpose: 'configuration' | 'additional';
    readonly selectionType: 'single' | 'multiple';
    readonly required: boolean;
    readonly minimumSelections: number;
    readonly maximumSelections: number;
    readonly defaultOptionName: string | null;
    readonly options: ReadonlyArray<{
      readonly name: string;
      readonly priceAdjustment: number;
    }>;
  }>;
  readonly orders: ReadonlyArray<CoffeeOrder>;
}

export interface CoffeeOrderItemDraftInput {
  readonly productId: string;
  readonly variantName?: string | null;
  readonly modifiers?: ReadonlyArray<{
    readonly modifierGroupId: string;
    readonly optionName: string;
  }>;
  readonly comment?: string;
}

export interface CoffeeSeatingInput {
  readonly guestCount: number;
  readonly note?: string;
  readonly allowCapacityOverride?: boolean;
}
