import type {
  WarehouseOperationsQueryContext,
  WarehouseOperationsResource,
} from './queries';

export interface WarehouseSupplierReceiptInput {
  readonly deliveryId: string;
  readonly supplierOrderId: string;
  readonly destinationWarehouseId: string;
  readonly supplierDocumentReference: string;
  readonly lines: ReadonlyArray<{
    readonly deliveryLineId: string;
    readonly resourceId: string;
    readonly resourceType: WarehouseOperationsResource['resourceType'];
    readonly resourceName: string;
    readonly quantityBase: number;
    readonly baseUnit: WarehouseOperationsResource['baseUnit'];
  }>;
}

export interface WarehouseSupplyReceiptService {
  recordSupplierDelivery(
    context: WarehouseOperationsQueryContext,
    input: WarehouseSupplierReceiptInput,
  ): Promise<void>;
}
