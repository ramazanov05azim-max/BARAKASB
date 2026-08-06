'use client';

import type {
  WarehouseConsumptionIssue,
  WarehouseInventoryDocument,
  WarehouseMovement,
  WarehouseStore,
} from './domain';

export const coffeeWarehouseStoragePrefix = 'barakasb.mock.coffee.warehouse.v1';
const sameTabEvent = 'barakasb:coffee-warehouse-changed';

export interface CoffeeWarehouseRepository {
  load(projectId: string, businessEnvironmentId: string): Promise<WarehouseStore>;
  appendBatch(
    projectId: string,
    businessEnvironmentId: string,
    movements: ReadonlyArray<WarehouseMovement>,
    issue?: WarehouseConsumptionIssue,
  ): Promise<WarehouseStore>;
  saveInventory(
    projectId: string,
    businessEnvironmentId: string,
    inventory: WarehouseInventoryDocument,
  ): Promise<WarehouseStore>;
  recordIssue(
    projectId: string,
    businessEnvironmentId: string,
    issue: WarehouseConsumptionIssue,
  ): Promise<WarehouseStore>;
  subscribe(projectId: string, listener: () => void): () => void;
}

const emptyStore = (): WarehouseStore => ({
  schemaVersion: 1,
  movements: [],
  inventories: [],
  issues: [],
});

const key = (projectId: string, environmentId: string): string =>
  `${coffeeWarehouseStoragePrefix}.${encodeURIComponent(projectId)}.${encodeURIComponent(environmentId)}`;

function storage(): Storage {
  if (typeof window === 'undefined') throw new Error('warehouse-browser-only');
  return window.localStorage;
}

function read(projectId: string, environmentId: string): WarehouseStore {
  const raw = storage().getItem(key(projectId, environmentId));
  if (!raw) return emptyStore();
  const parsed = JSON.parse(raw) as Partial<WarehouseStore>;
  return {
    schemaVersion: 1,
    movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    inventories: Array.isArray(parsed.inventories) ? parsed.inventories : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
  };
}

function write(projectId: string, environmentId: string, store: WarehouseStore): void {
  storage().setItem(key(projectId, environmentId), JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(sameTabEvent, { detail: { projectId } }));
}

export function createLocalCoffeeWarehouseRepository(): CoffeeWarehouseRepository {
  return {
    async load(projectId, environmentId) {
      return structuredClone(read(projectId, environmentId));
    },
    async appendBatch(projectId, environmentId, movements, issue) {
      const current = read(projectId, environmentId);
      const keys = new Set(current.movements.map((entry) => entry.idempotencyKey));
      if (movements.some((entry) => keys.has(entry.idempotencyKey))) {
        return structuredClone(current);
      }
      if (
        new Set(movements.map((entry) => entry.idempotencyKey)).size !==
        movements.length
      ) {
        throw new Error('duplicate-idempotency-key');
      }
      const next: WarehouseStore = {
        ...current,
        movements: [...current.movements, ...structuredClone(movements)],
        issues: issue ? [...current.issues, structuredClone(issue)] : current.issues,
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async saveInventory(projectId, environmentId, inventory) {
      const current = read(projectId, environmentId);
      const existing = current.inventories.find(
        (candidate) => candidate.inventoryId === inventory.inventoryId,
      );
      if (existing?.status === 'POSTED') throw new Error('inventory-immutable');
      const next = {
        ...current,
        inventories: existing
          ? current.inventories.map((candidate) =>
              candidate.inventoryId === inventory.inventoryId
                ? structuredClone(inventory)
                : candidate,
            )
          : [...current.inventories, structuredClone(inventory)],
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async recordIssue(projectId, environmentId, issue) {
      const current = read(projectId, environmentId);
      if (current.issues.some((candidate) => candidate.issueId === issue.issueId)) {
        return structuredClone(current);
      }
      const next = { ...current, issues: [...current.issues, structuredClone(issue)] };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    subscribe(projectId, listener) {
      const storageListener = (event: StorageEvent): void => {
        if (
          event.key?.startsWith(
            `${coffeeWarehouseStoragePrefix}.${encodeURIComponent(projectId)}.`,
          )
        )
          listener();
      };
      const localListener = (event: Event): void => {
        if (
          (event as CustomEvent<{ projectId: string }>).detail.projectId === projectId
        )
          listener();
      };
      window.addEventListener('storage', storageListener);
      window.addEventListener(sameTabEvent, localListener);
      return () => {
        window.removeEventListener('storage', storageListener);
        window.removeEventListener(sameTabEvent, localListener);
      };
    },
  };
}

export const localCoffeeWarehouseRepository = createLocalCoffeeWarehouseRepository();
