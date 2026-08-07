export interface PurchasingOperationsQueryContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface PurchasingOperationsReadModel {
  readonly needs: ReadonlyArray<{
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly resourceId: string;
    readonly resourceName: string;
    readonly quantityBase: number;
    readonly baseUnit: 'g' | 'ml' | 'pc';
    readonly thresholdBase: number | null;
    readonly recommendedQuantityBase: number | null;
    readonly state: 'OUT_OF_STOCK' | 'BELOW_MINIMUM' | 'SUFFICIENT' | 'NEGATIVE';
    readonly preferredSupplierName: string | null;
    readonly hasOpenOrder: boolean;
  }>;
  readonly orders: ReadonlyArray<{
    readonly orderId: string;
    readonly orderNumber: string;
    readonly supplierName: string;
    readonly destinationWarehouseId: string;
    readonly destinationWarehouseName: string;
    readonly status:
      'DRAFT' | 'SENT' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED';
    readonly expectedDeliveryAt: string | null;
    readonly isOverdue: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly employeeId: string;
    readonly totalExpected: number;
    readonly resourceNames: ReadonlyArray<string>;
  }>;
  readonly deliveries: ReadonlyArray<{
    readonly deliveryId: string;
    readonly deliveryNumber: string;
    readonly supplierOrderId: string;
    readonly supplierName: string;
    readonly destinationWarehouseId: string;
    readonly destinationWarehouseName: string;
    readonly status: 'DRAFT' | 'POSTED' | 'CANCELLED';
    readonly supplierDocumentReference: string;
    readonly deliveredAt: string;
    readonly occurredAt: string;
    readonly employeeId: string;
    readonly totalActual: number;
    readonly expectedTotalForDeliveredQuantity: number;
    readonly actualPriceHigher: boolean;
    readonly overdelivery: boolean;
    readonly resourceNames: ReadonlyArray<string>;
  }>;
  readonly configurationWarnings: ReadonlyArray<{
    readonly warningId: string;
    readonly message: string;
    readonly resourceId: string | null;
  }>;
}

export interface PurchasingOperationsQueryService {
  queryOperations(
    context: PurchasingOperationsQueryContext,
  ): Promise<PurchasingOperationsReadModel>;
  subscribe(
    context: PurchasingOperationsQueryContext,
    listener: () => void,
  ): () => void;
}
