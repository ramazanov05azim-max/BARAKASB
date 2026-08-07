'use client';

import type {
  PurchaseDelivery,
  PurchasePriceHistoryEntry,
  PurchaserConfigurationWarning,
  PurchaserStore,
  SupplierAssortment,
  SupplierOrder,
} from './domain';

export const coffeePurchaserStoragePrefix = 'barakasb.mock.coffee.purchasing.v1';
const sameTabEvent = 'barakasb:coffee-purchasing-changed';

export interface CoffeePurchaserRepository {
  load(projectId: string, businessEnvironmentId: string): Promise<PurchaserStore>;
  saveAssortment(
    projectId: string,
    businessEnvironmentId: string,
    assortment: SupplierAssortment,
  ): Promise<PurchaserStore>;
  removeAssortment(
    projectId: string,
    businessEnvironmentId: string,
    assortmentId: string,
  ): Promise<PurchaserStore>;
  saveOrder(
    projectId: string,
    businessEnvironmentId: string,
    order: SupplierOrder,
  ): Promise<PurchaserStore>;
  saveDelivery(
    projectId: string,
    businessEnvironmentId: string,
    delivery: PurchaseDelivery,
  ): Promise<PurchaserStore>;
  commitPostedDelivery(
    projectId: string,
    businessEnvironmentId: string,
    input: {
      readonly delivery: PurchaseDelivery;
      readonly order: SupplierOrder;
      readonly priceEntries: ReadonlyArray<PurchasePriceHistoryEntry>;
      readonly assortmentUpdates: ReadonlyArray<SupplierAssortment>;
    },
  ): Promise<PurchaserStore>;
  saveWarnings(
    projectId: string,
    businessEnvironmentId: string,
    warnings: ReadonlyArray<PurchaserConfigurationWarning>,
  ): Promise<PurchaserStore>;
  subscribe(projectId: string, listener: () => void): () => void;
}

const emptyStore = (): PurchaserStore => ({
  schemaVersion: 1,
  assortments: [],
  orders: [],
  deliveries: [],
  priceHistory: [],
  warnings: [],
});

const key = (projectId: string, environmentId: string): string =>
  `${coffeePurchaserStoragePrefix}.${encodeURIComponent(projectId)}.${encodeURIComponent(environmentId)}`;

function storage(): Storage {
  if (typeof window === 'undefined') throw new Error('purchasing-browser-only');
  return window.localStorage;
}

function read(projectId: string, environmentId: string): PurchaserStore {
  const raw = storage().getItem(key(projectId, environmentId));
  if (!raw) return emptyStore();
  const parsed = JSON.parse(raw) as Partial<PurchaserStore>;
  return {
    schemaVersion: 1,
    assortments: Array.isArray(parsed.assortments) ? parsed.assortments : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : [],
    priceHistory: Array.isArray(parsed.priceHistory) ? parsed.priceHistory : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  };
}

function write(projectId: string, environmentId: string, value: PurchaserStore): void {
  storage().setItem(key(projectId, environmentId), JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(sameTabEvent, { detail: { projectId } }));
}

function replaceById<T>(
  values: ReadonlyArray<T>,
  value: T,
  id: (candidate: T) => string,
): T[] {
  return values.some((candidate) => id(candidate) === id(value))
    ? values.map((candidate) => (id(candidate) === id(value) ? value : candidate))
    : [...values, value];
}

export function createLocalCoffeePurchaserRepository(): CoffeePurchaserRepository {
  return {
    async load(projectId, environmentId) {
      return structuredClone(read(projectId, environmentId));
    },
    async saveAssortment(projectId, environmentId, assortment) {
      const current = read(projectId, environmentId);
      const next = {
        ...current,
        assortments: replaceById(
          current.assortments,
          structuredClone(assortment),
          (candidate) => candidate.assortmentId,
        ),
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async removeAssortment(projectId, environmentId, assortmentId) {
      const current = read(projectId, environmentId);
      const next = {
        ...current,
        assortments: current.assortments.filter(
          (candidate) => candidate.assortmentId !== assortmentId,
        ),
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async saveOrder(projectId, environmentId, order) {
      const current = read(projectId, environmentId);
      const next = {
        ...current,
        orders: replaceById(
          current.orders,
          structuredClone(order),
          (item) => item.orderId,
        ),
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async saveDelivery(projectId, environmentId, delivery) {
      const current = read(projectId, environmentId);
      const existing = current.deliveries.find(
        (candidate) => candidate.deliveryId === delivery.deliveryId,
      );
      if (existing?.status === 'POSTED') throw new Error('delivery-immutable');
      if (delivery.status === 'POSTED')
        throw new Error('delivery-post-requires-commit');
      const next = {
        ...current,
        deliveries: replaceById(
          current.deliveries,
          structuredClone(delivery),
          (item) => item.deliveryId,
        ),
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async commitPostedDelivery(projectId, environmentId, input) {
      const current = read(projectId, environmentId);
      const existing = current.deliveries.find(
        (candidate) => candidate.deliveryId === input.delivery.deliveryId,
      );
      if (existing?.status === 'POSTED') throw new Error('duplicate-delivery');
      if (input.delivery.status !== 'POSTED') throw new Error('delivery-not-posted');
      const priceIds = new Set(
        current.priceHistory.map((entry) => entry.priceHistoryId),
      );
      const next = {
        ...current,
        deliveries: replaceById(
          current.deliveries,
          structuredClone(input.delivery),
          (item) => item.deliveryId,
        ),
        orders: replaceById(
          current.orders,
          structuredClone(input.order),
          (item) => item.orderId,
        ),
        priceHistory: [
          ...current.priceHistory,
          ...structuredClone(input.priceEntries).filter(
            (entry) => !priceIds.has(entry.priceHistoryId),
          ),
        ],
        assortments: input.assortmentUpdates.reduce(
          (values, assortment) =>
            replaceById(
              values,
              structuredClone(assortment),
              (item) => item.assortmentId,
            ),
          [...current.assortments],
        ),
      };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    async saveWarnings(projectId, environmentId, warnings) {
      const current = read(projectId, environmentId);
      const next = { ...current, warnings: structuredClone(warnings) };
      write(projectId, environmentId, next);
      return structuredClone(next);
    },
    subscribe(projectId, listener) {
      const storageListener = (event: StorageEvent): void => {
        if (
          event.key?.startsWith(
            `${coffeePurchaserStoragePrefix}.${encodeURIComponent(projectId)}.`,
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

export const localCoffeePurchaserRepository = createLocalCoffeePurchaserRepository();
