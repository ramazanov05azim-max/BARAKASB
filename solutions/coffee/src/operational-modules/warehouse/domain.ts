import type { StockedResourceType } from '../../domain';

export type WarehouseMovementType =
  | 'OPENING_BALANCE'
  | 'RECEIPT'
  | 'WRITE_OFF'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'INVENTORY_SURPLUS'
  | 'INVENTORY_SHORTAGE'
  | 'SALE_CONSUMPTION'
  | 'REVERSAL';

export type WarehouseBaseUnit = 'g' | 'ml' | 'pc';

export interface WarehouseMovement {
  readonly movementId: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly warehouseId: string;
  readonly resourceId: string;
  readonly resourceType: StockedResourceType;
  readonly movementType: WarehouseMovementType;
  readonly quantityDeltaBase: number;
  readonly baseUnit: WarehouseBaseUnit;
  readonly sourceDocumentType: string;
  readonly sourceDocumentId: string;
  readonly occurredAt: string;
  readonly employeeId: string;
  readonly workspaceId: string;
  readonly comment: string;
  readonly idempotencyKey: string;
}

export interface WarehouseInventoryLine {
  readonly resourceId: string;
  readonly resourceType: StockedResourceType;
  readonly systemQuantityBase: number;
  readonly actualQuantityBase: number | null;
  readonly baseUnit: WarehouseBaseUnit;
}

export interface WarehouseInventoryDocument {
  readonly inventoryId: string;
  readonly warehouseId: string;
  readonly status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  readonly createdAt: string;
  readonly createdBy: string;
  readonly postedAt: string | null;
  readonly postedBy: string | null;
  readonly lines: ReadonlyArray<WarehouseInventoryLine>;
  readonly comment: string;
}

export interface WarehouseConsumptionIssue {
  readonly issueId: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly orderId: string;
  readonly code: 'WAREHOUSE_NOT_ASSIGNED' | 'RECIPE_NOT_FOUND' | 'RECIPE_CYCLE';
  readonly message: string;
  readonly occurredAt: string;
  readonly resolvedAt: string | null;
}

export interface WarehouseStore {
  readonly schemaVersion: 1;
  readonly movements: ReadonlyArray<WarehouseMovement>;
  readonly inventories: ReadonlyArray<WarehouseInventoryDocument>;
  readonly issues: ReadonlyArray<WarehouseConsumptionIssue>;
}

export interface WarehouseRuntimeContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface WarehouseStockResource {
  readonly resourceId: string;
  readonly resourceType: StockedResourceType;
  readonly name: string;
  readonly accountingType: 'weight' | 'volume' | 'pieces';
  readonly baseUnit: WarehouseBaseUnit;
  readonly baseUnitId: string;
  readonly purchaseUnitId: string;
  readonly purchasePackageSize: number;
  readonly minimumStockBase: number | null;
  readonly active: boolean;
}

export interface WarehouseBalance {
  readonly warehouseId: string;
  readonly resource: WarehouseStockResource;
  readonly quantityBase: number;
  readonly lastMovementAt: string | null;
  readonly status: 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK' | 'NEGATIVE';
}

export interface WarehouseState {
  readonly employeeName: string;
  readonly employees: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly warehouses: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly resources: ReadonlyArray<WarehouseStockResource>;
  readonly balances: ReadonlyArray<WarehouseBalance>;
  readonly movements: ReadonlyArray<WarehouseMovement>;
  readonly inventories: ReadonlyArray<WarehouseInventoryDocument>;
  readonly issues: ReadonlyArray<WarehouseConsumptionIssue>;
}

export interface WarehouseThresholdProvider {
  getThreshold(input: {
    readonly projectId: string;
    readonly warehouseId: string;
    readonly resourceId: string;
    readonly locationId: string | null;
  }): Promise<number | null>;
}

export interface WarehouseReversalPort {
  reverseDocument(input: {
    readonly context: WarehouseRuntimeContext;
    readonly sourceDocumentId: string;
    readonly reason: string;
  }): Promise<ReadonlyArray<WarehouseMovement>>;
}
