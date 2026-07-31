import type { CoffeeBarOrderRepository } from './bar-repository-contracts';
import type { CoffeeFloorPlan, CoffeeFloorPlanZone, CoffeeTable } from './domain';
import type { CoffeeManagerRepositories } from './repository-contracts';

export type CoffeeFloorPlanErrorCode =
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'ZONE_NOT_EMPTY'
  | 'ACTIVE_ORDER'
  | 'DUPLICATE_CODE';

export class CoffeeFloorPlanError extends Error {
  constructor(public readonly code: CoffeeFloorPlanErrorCode) {
    super(code);
    this.name = 'CoffeeFloorPlanError';
  }
}

export interface CoffeeFloorPlanService {
  load(projectId: string): Promise<CoffeeFloorPlan>;
  canEdit(projectId: string): Promise<boolean>;
  createZone(
    projectId: string,
    input: Omit<CoffeeFloorPlanZone, 'id' | 'updatedAt' | 'sortOrder'>,
  ): Promise<CoffeeFloorPlan>;
  updateZone(
    projectId: string,
    zoneId: string,
    input: Partial<Omit<CoffeeFloorPlanZone, 'id' | 'locationId'>>,
  ): Promise<CoffeeFloorPlan>;
  deleteZone(projectId: string, zoneId: string): Promise<CoffeeFloorPlan>;
  createTable(
    projectId: string,
    input: Omit<CoffeeTable, 'id' | 'updatedAt' | 'sortOrder'>,
  ): Promise<CoffeeFloorPlan>;
  updateTable(
    projectId: string,
    tableId: string,
    input: Partial<Omit<CoffeeTable, 'id' | 'locationId'>>,
  ): Promise<CoffeeFloorPlan>;
  deleteTable(projectId: string, tableId: string): Promise<CoffeeFloorPlan>;
}

interface Dependencies {
  manager: Pick<
    CoffeeManagerRepositories,
    'floorPlan' | 'loadSnapshot' | 'permissions'
  >;
  orders: CoffeeBarOrderRepository;
  now?: () => string;
  createId?: () => string;
}

const terminalOrderStatuses = new Set(['COMPLETED', 'CANCELLED']);
const standardZoneNames = {
  MAIN_HALL: 'Основной зал',
  TERRACE: 'Терраса',
  STREET: 'Улица',
  BAR_COUNTER: 'Барная стойка',
} as const;

function zoneName(
  zoneType: CoffeeFloorPlanZone['zoneType'],
  customName: string,
): string {
  return zoneType === 'OTHER' ? customName.trim() : standardZoneNames[zoneType];
}

function validateZone(zone: CoffeeFloorPlanZone): void {
  if (
    !zone.name.trim() ||
    zone.canvasWidth < 320 ||
    zone.canvasWidth > 3000 ||
    zone.canvasHeight < 240 ||
    zone.canvasHeight > 2000
  ) {
    throw new CoffeeFloorPlanError('INVALID_INPUT');
  }
}

function validateTable(table: CoffeeTable, zone: CoffeeFloorPlanZone): void {
  if (
    !table.name.trim() ||
    !table.code.trim() ||
    !Number.isInteger(table.seatCount) ||
    table.seatCount < 1 ||
    table.seatCount > 50 ||
    table.width < 40 ||
    table.height < 40 ||
    table.positionX < 0 ||
    table.positionY < 0 ||
    table.positionX + table.width > zone.canvasWidth ||
    table.positionY + table.height > zone.canvasHeight ||
    table.rotation < 0 ||
    table.rotation >= 360
  ) {
    throw new CoffeeFloorPlanError('INVALID_INPUT');
  }
}

export function createCoffeeFloorPlanService({
  manager,
  orders,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): CoffeeFloorPlanService {
  async function hasEditAccess(projectId: string): Promise<boolean> {
    const snapshot = await manager.loadSnapshot(projectId);
    const capabilities = await manager.permissions.capabilitiesForRole(
      projectId,
      snapshot.currentRoleId,
    );
    return capabilities.includes('locations.manage');
  }

  async function assertEditAccess(projectId: string): Promise<void> {
    if (!(await hasEditAccess(projectId))) {
      throw new CoffeeFloorPlanError('ACCESS_DENIED');
    }
  }

  async function hasActiveOrder(projectId: string, tableId: string): Promise<boolean> {
    const store = await orders.load(projectId);
    return store.orders.some(
      (order) => order.tableId === tableId && !terminalOrderStatuses.has(order.status),
    );
  }

  async function save(
    projectId: string,
    floorPlan: CoffeeFloorPlan,
  ): Promise<CoffeeFloorPlan> {
    return manager.floorPlan.save(projectId, floorPlan);
  }

  return {
    load: (projectId) => manager.floorPlan.load(projectId),
    canEdit: hasEditAccess,
    async createZone(projectId, input) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      const zone: CoffeeFloorPlanZone = {
        ...input,
        id: createId(),
        name: zoneName(input.zoneType, input.name),
        sortOrder: floorPlan.zones.length,
        updatedAt: now(),
      };
      validateZone(zone);
      return save(projectId, { ...floorPlan, zones: [...floorPlan.zones, zone] });
    },
    async updateZone(projectId, zoneId, input) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      const current = floorPlan.zones.find((zone) => zone.id === zoneId);
      if (!current) throw new CoffeeFloorPlanError('NOT_FOUND');
      const updated = {
        ...current,
        ...input,
        name: zoneName(input.zoneType ?? current.zoneType, input.name ?? current.name),
        updatedAt: now(),
      };
      validateZone(updated);
      if (
        floorPlan.tables
          .filter((table) => table.zoneId === zoneId)
          .some(
            (table) =>
              table.positionX + table.width > updated.canvasWidth ||
              table.positionY + table.height > updated.canvasHeight,
          )
      ) {
        throw new CoffeeFloorPlanError('INVALID_INPUT');
      }
      if (
        input.active === false &&
        (
          await Promise.all(
            floorPlan.tables
              .filter((table) => table.zoneId === zoneId)
              .map((table) => hasActiveOrder(projectId, table.id)),
          )
        ).some(Boolean)
      ) {
        throw new CoffeeFloorPlanError('ACTIVE_ORDER');
      }
      return save(projectId, {
        ...floorPlan,
        zones: floorPlan.zones.map((zone) => (zone.id === zoneId ? updated : zone)),
      });
    },
    async deleteZone(projectId, zoneId) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      if (!floorPlan.zones.some((zone) => zone.id === zoneId)) {
        throw new CoffeeFloorPlanError('NOT_FOUND');
      }
      if (floorPlan.tables.some((table) => table.zoneId === zoneId)) {
        throw new CoffeeFloorPlanError('ZONE_NOT_EMPTY');
      }
      return save(projectId, {
        ...floorPlan,
        zones: floorPlan.zones.filter((zone) => zone.id !== zoneId),
      });
    },
    async createTable(projectId, input) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      const zone = floorPlan.zones.find(
        (candidate) =>
          candidate.id === input.zoneId && candidate.locationId === input.locationId,
      );
      if (!zone) throw new CoffeeFloorPlanError('NOT_FOUND');
      if (
        floorPlan.tables.some(
          (table) =>
            table.locationId === input.locationId &&
            table.code.toLocaleLowerCase('ru') ===
              input.code.trim().toLocaleLowerCase('ru'),
        )
      ) {
        throw new CoffeeFloorPlanError('DUPLICATE_CODE');
      }
      const table: CoffeeTable = {
        ...input,
        id: createId(),
        name: input.name.trim(),
        code: input.code.trim(),
        sortOrder: floorPlan.tables.length,
        updatedAt: now(),
      };
      validateTable(table, zone);
      return save(projectId, { ...floorPlan, tables: [...floorPlan.tables, table] });
    },
    async updateTable(projectId, tableId, input) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      const current = floorPlan.tables.find((table) => table.id === tableId);
      if (!current) throw new CoffeeFloorPlanError('NOT_FOUND');
      const updated: CoffeeTable = {
        ...current,
        ...input,
        name: input.name?.trim() ?? current.name,
        code: input.code?.trim() ?? current.code,
        updatedAt: now(),
      };
      const zone = floorPlan.zones.find(
        (candidate) =>
          candidate.id === updated.zoneId &&
          candidate.locationId === updated.locationId,
      );
      if (!zone) throw new CoffeeFloorPlanError('NOT_FOUND');
      if (
        floorPlan.tables.some(
          (table) =>
            table.id !== tableId &&
            table.locationId === updated.locationId &&
            table.code.toLocaleLowerCase('ru') === updated.code.toLocaleLowerCase('ru'),
        )
      ) {
        throw new CoffeeFloorPlanError('DUPLICATE_CODE');
      }
      validateTable(updated, zone);
      if (
        input.status === 'inactive' &&
        current.status === 'active' &&
        (await hasActiveOrder(projectId, tableId))
      ) {
        throw new CoffeeFloorPlanError('ACTIVE_ORDER');
      }
      return save(projectId, {
        ...floorPlan,
        tables: floorPlan.tables.map((table) =>
          table.id === tableId ? updated : table,
        ),
      });
    },
    async deleteTable(projectId, tableId) {
      await assertEditAccess(projectId);
      const floorPlan = await manager.floorPlan.load(projectId);
      if (!floorPlan.tables.some((table) => table.id === tableId)) {
        throw new CoffeeFloorPlanError('NOT_FOUND');
      }
      if (await hasActiveOrder(projectId, tableId)) {
        throw new CoffeeFloorPlanError('ACTIVE_ORDER');
      }
      return save(projectId, {
        ...floorPlan,
        tables: floorPlan.tables.filter((table) => table.id !== tableId),
      });
    },
  };
}
