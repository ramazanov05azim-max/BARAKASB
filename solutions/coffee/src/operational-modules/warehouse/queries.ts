export interface WarehouseOperationsQueryContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface WarehouseOperationsResource {
  readonly resourceId: string;
  readonly resourceType: 'ingredient' | 'preparation' | 'semi-finished' | 'package';
  readonly name: string;
  readonly accountingType: 'weight' | 'volume' | 'pieces';
  readonly baseUnit: 'g' | 'ml' | 'pc';
  readonly baseUnitId: string;
  readonly purchaseUnitId: string;
  readonly purchasePackageSize: number;
  readonly minimumStockBase: number | null;
  readonly active: boolean;
}

export interface WarehouseOperationsReadModel {
  readonly warehouses: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly resources: ReadonlyArray<WarehouseOperationsResource>;
  readonly balances: ReadonlyArray<{
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly resourceId: string;
    readonly resourceName: string;
    readonly resourceType: 'ingredient' | 'preparation' | 'semi-finished' | 'package';
    readonly accountingType: 'weight' | 'volume' | 'pieces';
    readonly quantityBase: number;
    readonly baseUnit: 'g' | 'ml' | 'pc';
    readonly baseUnitId: string;
    readonly purchaseUnitId: string;
    readonly purchasePackageSize: number;
    readonly minimumStockBase: number | null;
    readonly status: 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK' | 'NEGATIVE';
  }>;
  readonly recentMovements: ReadonlyArray<{
    readonly movementId: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly resourceId: string;
    readonly resourceName: string;
    readonly movementType: string;
    readonly quantityDeltaBase: number;
    readonly baseUnit: 'g' | 'ml' | 'pc';
    readonly sourceDocumentType: string;
    readonly sourceDocumentId: string;
    readonly occurredAt: string;
    readonly employeeId: string;
  }>;
  readonly issues: ReadonlyArray<{
    readonly issueId: string;
    readonly code: string;
    readonly message: string;
    readonly occurredAt: string;
    readonly resolved: boolean;
  }>;
}

export interface WarehouseOperationsQueryService {
  queryOperations(
    context: WarehouseOperationsQueryContext,
  ): Promise<WarehouseOperationsReadModel>;
  subscribe(context: WarehouseOperationsQueryContext, listener: () => void): () => void;
}
