'use client';

import type { CoffeeBarStore } from './bar-domain';
import type { CoffeeBarOrderRepository } from './bar-repository-contracts';

export const coffeeBarOrderStoragePrefix = 'barakasb.mock.coffee.bar-orders.v1';
const sameTabEvent = 'barakasb:coffee-bar-orders-changed';

function key(projectId: string): string {
  return `${coffeeBarOrderStoragePrefix}.${encodeURIComponent(projectId)}`;
}

function emptyStore(): CoffeeBarStore {
  return { orders: [], audit: [] };
}

function browserStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('coffee-bar-local-repository-browser-only');
  }
  return window.localStorage;
}

function read(storage: Storage, projectId: string): CoffeeBarStore {
  const stored = storage.getItem(key(projectId));
  if (!stored) return emptyStore();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('orders' in parsed) ||
      !Array.isArray(parsed.orders) ||
      !('audit' in parsed) ||
      !Array.isArray(parsed.audit)
    ) {
      return emptyStore();
    }
    return parsed as CoffeeBarStore;
  } catch {
    return emptyStore();
  }
}

export function createLocalCoffeeBarOrderRepository(
  storage: Storage,
  eventTarget?: Pick<
    Window,
    'addEventListener' | 'removeEventListener' | 'dispatchEvent'
  >,
): CoffeeBarOrderRepository {
  return {
    async load(projectId) {
      return structuredClone(read(storage, projectId));
    },
    async save(projectId, store) {
      storage.setItem(key(projectId), JSON.stringify(store));
      eventTarget?.dispatchEvent(
        new CustomEvent(sameTabEvent, { detail: { projectId } }),
      );
    },
    subscribe(projectId, listener) {
      if (!eventTarget) return () => undefined;
      const handleStorage = (event: Event): void => {
        if (event instanceof StorageEvent && event.key !== key(projectId)) {
          return;
        }
        if (
          event instanceof CustomEvent &&
          event.type === sameTabEvent &&
          (event.detail as { projectId?: string } | null)?.projectId !== projectId
        ) {
          return;
        }
        listener();
      };
      eventTarget.addEventListener('storage', handleStorage);
      eventTarget.addEventListener(sameTabEvent, handleStorage);
      return () => {
        eventTarget.removeEventListener('storage', handleStorage);
        eventTarget.removeEventListener(sameTabEvent, handleStorage);
      };
    },
    async remove(projectId) {
      storage.removeItem(key(projectId));
      eventTarget?.dispatchEvent(
        new CustomEvent(sameTabEvent, { detail: { projectId } }),
      );
    },
  };
}

export const localCoffeeBarOrderRepository: CoffeeBarOrderRepository = {
  load: (projectId) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).load(projectId),
  save: (projectId, store) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).save(
      projectId,
      store,
    ),
  subscribe: (projectId, listener) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).subscribe(
      projectId,
      listener,
    ),
  remove: (projectId) =>
    createLocalCoffeeBarOrderRepository(browserStorage(), window).remove(projectId),
};
