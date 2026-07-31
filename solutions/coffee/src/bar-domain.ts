export type CoffeeOrderType = 'TABLE' | 'TAKEAWAY';
export type CoffeeOrderStatus =
  'DRAFT' | 'SENT' | 'IN_PREPARATION' | 'READY' | 'ISSUED' | 'CANCELLED';
export type CoffeePaymentStatus = 'UNPAID' | 'CASH' | 'CARD';
export type CoffeePreparationWorkspace = 'BAR' | 'KITCHEN' | 'IMMEDIATE';
export type CoffeeOrderItemStatus =
  'DRAFT' | 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'CANCELLED';
export type CoffeeTableOperationalStatus = 'FREE' | 'OCCUPIED' | 'READY' | 'UNPAID';

export interface CoffeeOrderItemModifier {
  readonly modifierGroupId: string;
  readonly modifierName: string;
  readonly optionName: string;
  readonly priceAdjustment: number;
}

export interface CoffeeOrderItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly modifiers: ReadonlyArray<CoffeeOrderItemModifier>;
  readonly comment: string;
  readonly preparationWorkspace: CoffeePreparationWorkspace;
  readonly status: CoffeeOrderItemStatus;
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
  readonly createdAt: string;
  readonly createdByEmployeeId: string;
  readonly paymentStatus: CoffeePaymentStatus;
  readonly total: number;
  readonly issuedAt: string | null;
  readonly updatedAt: string;
  readonly items: ReadonlyArray<CoffeeOrderItem>;
}

export interface CoffeeBarAuditEntry {
  readonly id: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly orderId: string;
  readonly employeeId: string;
  readonly operation:
    | 'ORDER_CREATED'
    | 'ORDER_SENT'
    | 'ITEM_STATUS_CHANGED'
    | 'PAYMENT_CHANGED'
    | 'ORDER_ISSUED'
    | 'ORDER_CANCELLED';
  readonly occurredAt: string;
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

export interface CoffeeBarTableView {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly seats: number;
  readonly status: CoffeeTableOperationalStatus;
  readonly activeOrderId: string | null;
}

export interface CoffeeBarState {
  readonly establishmentName: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly employeeId: string;
  readonly employeeName: string;
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
    readonly options: ReadonlyArray<{
      readonly name: string;
      readonly priceAdjustment: number;
    }>;
  }>;
  readonly orders: ReadonlyArray<CoffeeOrder>;
}

export interface CoffeeOrderItemDraftInput {
  readonly productId: string;
  readonly modifiers?: ReadonlyArray<{
    readonly modifierGroupId: string;
    readonly optionName: string;
  }>;
  readonly comment?: string;
}
