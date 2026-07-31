import { beforeEach, describe, expect, it } from 'vitest';
import type { CoffeeBarStore } from './bar-domain';
import type { CoffeeBarOrderRepository } from './bar-repository-contracts';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import type { CoffeeFloorPlan, CoffeeSnapshot } from './domain';
import { createCoffeeFloorPlanService } from './floor-plan-service';
import type { CoffeeManagerRepositories } from './repository-contracts';

const projectId = 'project-coffee';
const timestamp = '2026-07-31T12:00:00.000Z';

function fixture(canManage = true) {
  const seed = createCoffeeCrashTestSeed(timestamp);
  let floorPlan: CoffeeFloorPlan = {
    zones: structuredClone(seed.floorPlanZones),
    tables: structuredClone(seed.tables),
  };
  let store: CoffeeBarStore = { orders: [], audit: [] };
  let sequence = 0;
  const manager: Pick<
    CoffeeManagerRepositories,
    'floorPlan' | 'loadSnapshot' | 'permissions'
  > = {
    floorPlan: {
      async load() {
        return structuredClone(floorPlan);
      },
      async save(_projectId, value) {
        floorPlan = structuredClone(value);
        return structuredClone(floorPlan);
      },
    },
    async loadSnapshot() {
      return { currentRoleId: 'owner' } as CoffeeSnapshot;
    },
    permissions: {
      async list() {
        return [];
      },
      async capabilitiesForRole() {
        return canManage ? ['locations.manage'] : ['locations.read'];
      },
      async setPreviewRole() {
        return undefined;
      },
    },
  };
  const orders: CoffeeBarOrderRepository = {
    async load() {
      return structuredClone(store);
    },
    async save(_projectId, value) {
      store = structuredClone(value);
    },
    subscribe() {
      return () => undefined;
    },
    async remove() {
      store = { orders: [], audit: [] };
    },
  };
  return {
    service: createCoffeeFloorPlanService({
      manager,
      orders,
      now: () => timestamp,
      createId: () => `generated-${++sequence}`,
    }),
    setStore(value: CoffeeBarStore) {
      store = value;
    },
  };
}

describe('Coffee floor-plan application service', () => {
  let subject: ReturnType<typeof fixture>;

  beforeEach(() => {
    subject = fixture();
  });

  it('loads zones and tables through the repository contract', async () => {
    const plan = await subject.service.load(projectId);
    expect(plan.zones.map((zone) => zone.name)).toContain('Основной зал');
    expect(plan.tables.map((table) => table.code)).toContain('T-01');
  });

  it('creates a zone with normalized metadata', async () => {
    const plan = await subject.service.createZone(projectId, {
      locationId: 'crash-location-main',
      name: '  Терраса  ',
      zoneType: 'TERRACE',
      canvasWidth: 900,
      canvasHeight: 600,
      active: true,
    });
    expect(plan.zones.at(-1)).toMatchObject({
      id: 'generated-1',
      name: 'Терраса',
      sortOrder: 2,
    });
  });

  it('rejects invalid canvas dimensions', async () => {
    await expect(
      subject.service.createZone(projectId, {
        locationId: 'crash-location-main',
        name: 'Малая',
        zoneType: 'OTHER',
        canvasWidth: 100,
        canvasHeight: 100,
        active: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('creates and moves a table within zone bounds', async () => {
    let plan = await subject.service.createTable(projectId, {
      locationId: 'crash-location-main',
      zoneId: 'crash-zone-main',
      name: 'Стол 8',
      code: 'T-13',
      shape: 'SQUARE',
      positionX: 20,
      positionY: 20,
      width: 80,
      height: 80,
      rotation: 0,
      seatCount: 4,
      status: 'active',
    });
    const table = plan.tables.at(-1)!;
    plan = await subject.service.updateTable(projectId, table.id, {
      positionX: 200,
      positionY: 220,
      rotation: 45,
    });
    expect(plan.tables.find((candidate) => candidate.id === table.id)).toMatchObject({
      positionX: 200,
      positionY: 220,
      rotation: 45,
    });
  });

  it('prevents duplicate table codes in a location', async () => {
    const first = (await subject.service.load(projectId)).tables[0]!;
    await expect(
      subject.service.createTable(projectId, {
        ...first,
        code: first.code,
        name: 'Дубликат',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_CODE' });
  });

  it('does not delete a non-empty zone', async () => {
    await expect(
      subject.service.deleteZone(projectId, 'crash-zone-main'),
    ).rejects.toMatchObject({ code: 'ZONE_NOT_EMPTY' });
  });

  it('does not delete or disable a table with an active order', async () => {
    subject.setStore({
      audit: [],
      orders: [
        {
          orderId: 'order-active',
          projectId,
          businessEnvironmentId: 'environment',
          workspaceId: 'workspace',
          locationId: 'crash-location-main',
          orderType: 'TABLE',
          tableId: 'crash-table-01',
          orderNumber: 'Б-0001',
          status: 'DRAFT',
          guestCount: 2,
          seatingNote: '',
          openedAt: timestamp,
          openedByEmployeeId: 'employee',
          createdAt: timestamp,
          createdByEmployeeId: 'employee',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
          paidAmount: null,
          paidAt: null,
          paidByEmployeeId: null,
          total: 0,
          issuedAt: null,
          completedAt: null,
          completedByEmployeeId: null,
          cancellationReason: null,
          updatedAt: timestamp,
          items: [],
          batches: [],
        },
      ],
    });
    await expect(
      subject.service.deleteTable(projectId, 'crash-table-01'),
    ).rejects.toMatchObject({ code: 'ACTIVE_ORDER' });
    await expect(
      subject.service.updateTable(projectId, 'crash-table-01', {
        status: 'inactive',
      }),
    ).rejects.toMatchObject({ code: 'ACTIVE_ORDER' });
  });

  it('denies mutations without locations.manage', async () => {
    const blocked = fixture(false).service;
    await expect(
      blocked.updateTable(projectId, 'crash-table-01', { name: 'Изменён' }),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
    await expect(blocked.load(projectId)).resolves.toBeDefined();
  });
});
