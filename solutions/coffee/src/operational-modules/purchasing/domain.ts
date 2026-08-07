import type { StockedResourceType, Supplier } from '../../domain';

export type PurchasableResourceType = Extract<
  StockedResourceType,
  'ingredient' | 'package'
>;
export type SupplierOrderStatus =
  'DRAFT' | 'SENT' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED';
export type PurchaseDeliveryStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type PurchasingBaseUnit = 'g' | 'ml' | 'pc';

export interface PurchasingWarehouseResource {
  readonly resourceId: string;
  readonly resourceType: PurchasableResourceType;
  readonly name: string;
  readonly accountingType: 'weight' | 'volume' | 'pieces';
  readonly baseUnit: PurchasingBaseUnit;
  readonly baseUnitId: string;
  readonly purchaseUnitId: string;
  readonly purchasePackageSize: number;
  readonly minimumStockBase: number | null;
  readonly active: boolean;
}

export interface PurchasingWarehouseBalance {
  readonly warehouseId: string;
  readonly resource: PurchasingWarehouseResource;
  readonly quantityBase: number;
  readonly lastMovementAt: string | null;
  readonly status: 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK' | 'NEGATIVE';
}

export interface PurchaserRuntimeContext {
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly employeeId: string;
}

export interface SupplierAssortment {
  readonly assortmentId: string;
  readonly supplierId: string;
  readonly resourceId: string;
  readonly resourceType: PurchasableResourceType;
  readonly supplierProductName: string | null;
  readonly supplierSku: string | null;
  readonly purchaseUnitId: string;
  readonly purchaseUnitName: string;
  readonly packageSize: number;
  readonly lastKnownPrice: number | null;
  readonly currency: string;
  readonly preferred: boolean;
  readonly status: 'active' | 'inactive';
  readonly updatedAt: string;
}

export interface SupplierOrderLine {
  readonly lineId: string;
  readonly resourceId: string;
  readonly resourceType: PurchasableResourceType;
  readonly resourceNameSnapshot: string;
  readonly purchaseUnitId: string;
  readonly purchaseUnitNameSnapshot: string;
  readonly packageSizeSnapshot: number;
  readonly baseUnit: PurchasingBaseUnit;
  readonly orderedQuantityPurchaseUnit: number;
  readonly orderedQuantityBase: number;
  readonly expectedUnitPrice: number;
  readonly expectedLineTotal: number;
}

export interface SupplierOrder {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly projectId: string;
  readonly businessEnvironmentId: string;
  readonly supplierId: string;
  readonly supplierNameSnapshot: string;
  readonly destinationWarehouseId: string;
  readonly destinationWarehouseNameSnapshot: string;
  readonly status: SupplierOrderStatus;
  readonly createdAt: string;
  readonly createdByEmployeeId: string;
  readonly workspaceId: string;
  readonly expectedDeliveryAt: string | null;
  readonly comment: string;
  readonly lines: ReadonlyArray<SupplierOrderLine>;
  readonly sentAt: string | null;
  readonly sentByEmployeeId: string | null;
  readonly cancelledAt: string | null;
  readonly cancelledByEmployeeId: string | null;
  readonly cancellationReason: string | null;
  readonly updatedAt: string;
}

export interface PurchaseDeliveryLine {
  readonly lineId: string;
  readonly orderLineId: string;
  readonly resourceId: string;
  readonly resourceType: PurchasableResourceType;
  readonly resourceNameSnapshot: string;
  readonly purchaseUnitId: string;
  readonly purchaseUnitNameSnapshot: string;
  readonly packageSizeSnapshot: number;
  readonly baseUnit: PurchasingBaseUnit;
  readonly deliveredQuantityPurchaseUnit: number;
  readonly deliveredQuantityBase: number;
  readonly actualUnitPrice: number;
  readonly actualLineTotal: number;
}

export interface PurchaseDelivery {
  readonly deliveryId: string;
  readonly deliveryNumber: string;
  readonly supplierOrderId: string;
  readonly supplierId: string;
  readonly supplierNameSnapshot: string;
  readonly destinationWarehouseId: string;
  readonly destinationWarehouseNameSnapshot: string;
  readonly status: PurchaseDeliveryStatus;
  readonly supplierDocumentReference: string;
  readonly deliveredAt: string;
  readonly createdAt: string;
  readonly createdByEmployeeId: string;
  readonly postedAt: string | null;
  readonly postedByEmployeeId: string | null;
  readonly comment: string;
  readonly lines: ReadonlyArray<PurchaseDeliveryLine>;
}

export interface PurchasePriceHistoryEntry {
  readonly priceHistoryId: string;
  readonly deliveryId: string;
  readonly supplierId: string;
  readonly supplierNameSnapshot: string;
  readonly resourceId: string;
  readonly resourceType: PurchasableResourceType;
  readonly resourceNameSnapshot: string;
  readonly purchaseUnitId: string;
  readonly purchaseUnitNameSnapshot: string;
  readonly packageSizeSnapshot: number;
  readonly actualUnitPrice: number;
  readonly baseUnitPrice: number;
  readonly currency: string;
  readonly recordedAt: string;
}

export interface PurchaserConfigurationWarning {
  readonly warningId: string;
  readonly message: string;
  readonly resourceId: string | null;
}

export interface PurchaserStore {
  readonly schemaVersion: 1;
  readonly assortments: ReadonlyArray<SupplierAssortment>;
  readonly orders: ReadonlyArray<SupplierOrder>;
  readonly deliveries: ReadonlyArray<PurchaseDelivery>;
  readonly priceHistory: ReadonlyArray<PurchasePriceHistoryEntry>;
  readonly warnings: ReadonlyArray<PurchaserConfigurationWarning>;
}

export interface PurchaseNeed {
  readonly warehouseId: string;
  readonly warehouseName: string;
  readonly resource: PurchasingWarehouseResource;
  readonly balance: PurchasingWarehouseBalance;
  readonly thresholdBase: number | null;
  readonly recommendedQuantityBase: number | null;
  readonly state: 'OUT_OF_STOCK' | 'BELOW_MINIMUM' | 'SUFFICIENT' | 'NEGATIVE';
  readonly preferredSupplier: Supplier | null;
  readonly lastPrice: PurchasePriceHistoryEntry | null;
  readonly barcode: string | null;
}

export interface PurchaserState {
  readonly employeeName: string;
  readonly employees: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly warehouses: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly suppliers: ReadonlyArray<Supplier>;
  readonly resources: ReadonlyArray<PurchasingWarehouseResource>;
  readonly needs: ReadonlyArray<PurchaseNeed>;
  readonly assortments: ReadonlyArray<SupplierAssortment>;
  readonly orders: ReadonlyArray<SupplierOrder>;
  readonly deliveries: ReadonlyArray<PurchaseDelivery>;
  readonly priceHistory: ReadonlyArray<PurchasePriceHistoryEntry>;
  readonly warnings: ReadonlyArray<PurchaserConfigurationWarning>;
}

export interface PurchaseThresholdProvider {
  getThreshold(input: {
    readonly projectId: string;
    readonly warehouseId: string;
    readonly resourceId: string;
    readonly locationId: string | null;
  }): Promise<{ readonly minimumBase: number; readonly targetBase: number } | null>;
}
