import type { CoffeeBarStore } from './bar-domain';

export interface CoffeeBarOrderRepository {
  load(projectId: string): Promise<CoffeeBarStore>;
  save(projectId: string, store: CoffeeBarStore): Promise<void>;
  subscribe(projectId: string, listener: () => void): () => void;
  remove(projectId: string): Promise<void>;
}

export class CoffeeBarOperationError extends Error {
  constructor(
    public readonly code:
      | 'ACCESS_DENIED'
      | 'NOT_FOUND'
      | 'INVALID_OPERATION'
      | 'TABLE_OCCUPIED'
      | 'ORDER_EMPTY'
      | 'ORDER_IMMUTABLE'
      | 'ITEM_ROUTE_MISMATCH'
      | 'PAYMENT_REQUIRED'
      | 'ORDER_NOT_READY',
  ) {
    super(code);
    this.name = 'CoffeeBarOperationError';
  }
}
