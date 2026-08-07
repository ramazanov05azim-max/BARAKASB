import type { CoffeeOrder } from '../../bar-domain';
import type { CoffeeOperationalReadRepository } from '../../repository-contracts';
import { expandCoffeeRecipe } from '../../recipe-engine/expansion';
import type {
  WarehouseBalance,
  WarehouseConsumptionIssue,
  WarehouseInventoryDocument,
  WarehouseMovement,
  WarehouseMovementType,
  WarehouseRuntimeContext,
  WarehouseState,
  WarehouseStockResource,
} from './domain';
import type { CoffeeWarehouseRepository } from './repository';
import { localCoffeeWarehouseRepository } from './repository';
import { localCoffeeOperationalReadRepository } from '../../repositories';
import type { WarehouseOperationsQueryService } from './queries';
import type { WarehouseSupplyReceiptService } from './supply';

export interface WarehouseQuantityInput {
  readonly warehouseId: string;
  readonly resourceId: string;
  readonly quantity: number;
  readonly unitId: string;
  readonly comment?: string;
  readonly idempotencyKey: string;
}

export interface CoffeeWarehouseService
  extends WarehouseOperationsQueryService, WarehouseSupplyReceiptService {
  load(context: WarehouseRuntimeContext): Promise<WarehouseState>;
  recordOpeningBalance(
    context: WarehouseRuntimeContext,
    input: WarehouseQuantityInput,
  ): Promise<void>;
  recordReceipt(
    context: WarehouseRuntimeContext,
    input: WarehouseQuantityInput & { readonly externalReference?: string },
  ): Promise<void>;
  recordWriteOff(
    context: WarehouseRuntimeContext,
    input: WarehouseQuantityInput & {
      readonly reason: string;
      readonly confirmNegative?: boolean;
    },
  ): Promise<void>;
  transfer(
    context: WarehouseRuntimeContext,
    input: Omit<WarehouseQuantityInput, 'warehouseId'> & {
      readonly sourceWarehouseId: string;
      readonly destinationWarehouseId: string;
      readonly confirmNegative?: boolean;
    },
  ): Promise<void>;
  createInventory(
    context: WarehouseRuntimeContext,
    warehouseId: string,
    comment?: string,
  ): Promise<WarehouseInventoryDocument>;
  updateInventoryLine(
    context: WarehouseRuntimeContext,
    inventoryId: string,
    resourceId: string,
    actualQuantity: number,
    unitId: string,
  ): Promise<WarehouseInventoryDocument>;
  postInventory(context: WarehouseRuntimeContext, inventoryId: string): Promise<void>;
  consumeCompletedOrder(
    context: WarehouseRuntimeContext,
    order: CoffeeOrder,
  ): Promise<void>;
}

interface Dependencies {
  readonly operational: CoffeeOperationalReadRepository;
  readonly warehouse: CoffeeWarehouseRepository;
  readonly now?: () => string;
  readonly createId?: () => string;
}

const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

export function createCoffeeWarehouseService({
  operational,
  warehouse,
  now = () => new Date().toISOString(),
  createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `local-${Date.now().toString(36)}`,
}: Dependencies): CoffeeWarehouseService {
  async function access(
    context: WarehouseRuntimeContext,
    allowBar = false,
    allowPurchasing = false,
    allowReadConsumer = false,
  ) {
    if (
      !context.projectId ||
      !context.businessEnvironmentId ||
      !context.workspaceId ||
      !context.employeeId
    )
      throw new Error('access-denied');
    const snapshot = await operational.load(context.projectId);
    const workspace = snapshot.solutionStructure.workspaces.find(
      (candidate) =>
        candidate.id === context.workspaceId &&
        (allowReadConsumer ||
          candidate.moduleId === 'warehouse' ||
          (allowBar && candidate.moduleId === 'bar') ||
          (allowPurchasing && candidate.moduleId === 'purchasing')),
    );
    const employee = snapshot.employees.find(
      (candidate) =>
        candidate.id === context.employeeId &&
        candidate.status === 'active' &&
        candidate.employmentStatus === 'active',
    );
    const ownerPreview = context.employeeId === 'owner-preview';
    if (
      !workspace ||
      (!ownerPreview &&
        (!employee || !workspace.assignedEmployeeIds.includes(employee.id)))
    )
      throw new Error('access-denied');
    return { snapshot, workspace };
  }

  function resources(
    snapshot: Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>,
  ): WarehouseStockResource[] {
    const ingredientResources: WarehouseStockResource[] = snapshot.ingredients.map(
      (ingredient) => {
        const unit = snapshot.units.find(
          (candidate) => candidate.id === ingredient.baseUnitId,
        );
        const accountingType =
          ingredient.accountingType ??
          (unit?.dimension === 'volume'
            ? 'volume'
            : unit?.dimension === 'count'
              ? 'pieces'
              : 'weight');
        const resourceType =
          ingredient.resourceType ??
          (ingredient.category === 'Расходники' ? 'package' : 'ingredient');
        return {
          resourceId: ingredient.id,
          resourceType,
          name: ingredient.name,
          accountingType,
          baseUnit:
            accountingType === 'volume'
              ? 'ml'
              : accountingType === 'pieces'
                ? 'pc'
                : 'g',
          baseUnitId: ingredient.baseUnitId,
          purchaseUnitId: ingredient.purchaseUnitId,
          purchasePackageSize:
            ingredient.purchasePackageSize ?? ingredient.conversionRate ?? 1,
          minimumStockBase:
            ingredient.minimumStock > 0 ? ingredient.minimumStock : null,
          active: ingredient.status === 'active',
        };
      },
    );
    const known = new Set(ingredientResources.map((resource) => resource.resourceId));
    const recipeTargets: WarehouseStockResource[] = snapshot.recipes.flatMap(
      (recipe) => {
        if (
          recipe.target.type === 'menu-item' ||
          known.has(recipe.target.id) ||
          recipe.status !== 'active'
        ) {
          return [];
        }
        const unit = snapshot.units.find(
          (candidate) => candidate.id === recipe.outputUnitId,
        );
        const accountingType: WarehouseStockResource['accountingType'] =
          unit?.dimension === 'volume'
            ? 'volume'
            : unit?.dimension === 'count'
              ? 'pieces'
              : 'weight';
        return [
          {
            resourceId: recipe.target.id,
            resourceType: recipe.target.type,
            name: recipe.target.name,
            accountingType,
            baseUnit:
              accountingType === 'volume'
                ? ('ml' as const)
                : accountingType === 'pieces'
                  ? ('pc' as const)
                  : ('g' as const),
            baseUnitId: recipe.outputUnitId,
            purchaseUnitId: recipe.outputUnitId,
            purchasePackageSize: unit?.conversionRate ?? 1,
            minimumStockBase: null,
            active: true,
          },
        ];
      },
    );
    return [...ingredientResources, ...recipeTargets];
  }

  function quantityBase(
    snapshot: Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>,
    resource: WarehouseStockResource,
    quantity: number,
    unitId: string,
  ): number {
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new Error('invalid-quantity');
    const unit = snapshot.units.find((candidate) => candidate.id === unitId);
    if (!unit) throw new Error('unit-not-found');
    const conversionFactor =
      unitId === resource.purchaseUnitId
        ? resource.purchasePackageSize
        : unit.conversionRate;
    return round(quantity * conversionFactor);
  }

  function movement(
    context: WarehouseRuntimeContext,
    input: {
      warehouseId: string;
      resource: WarehouseStockResource;
      type: WarehouseMovementType;
      delta: number;
      documentType: string;
      documentId: string;
      comment: string;
      idempotencyKey: string;
    },
  ): WarehouseMovement {
    return {
      movementId: createId(),
      projectId: context.projectId,
      businessEnvironmentId: context.businessEnvironmentId,
      warehouseId: input.warehouseId,
      resourceId: input.resource.resourceId,
      resourceType: input.resource.resourceType,
      movementType: input.type,
      quantityDeltaBase: round(input.delta),
      baseUnit: input.resource.baseUnit,
      sourceDocumentType: input.documentType,
      sourceDocumentId: input.documentId,
      occurredAt: now(),
      employeeId: context.employeeId,
      workspaceId: context.workspaceId,
      comment: input.comment,
      idempotencyKey: input.idempotencyKey,
    };
  }

  async function migrateExplicitOpeningBalances(
    context: WarehouseRuntimeContext,
    snapshot: Awaited<ReturnType<CoffeeOperationalReadRepository['load']>>,
  ): Promise<void> {
    const current = await warehouse.load(
      context.projectId,
      context.businessEnvironmentId,
    );
    const existing = new Set(current.movements.map((entry) => entry.idempotencyKey));
    const resourceList = resources(snapshot);
    const migrations = snapshot.openingStockBalances.flatMap((opening) => {
      const idempotencyKey = `legacy-opening:${opening.id}`;
      const resource = resourceList.find(
        (candidate) => candidate.resourceId === opening.ingredientId,
      );
      if (!resource || existing.has(idempotencyKey)) return [];
      const unit = snapshot.units.find((candidate) => candidate.id === opening.unitId);
      return [
        movement(
          {
            ...context,
            employeeId: 'system-migration',
            workspaceId: 'warehouse-ledger-migration',
          },
          {
            warehouseId: opening.warehouseId,
            resource,
            type: 'OPENING_BALANCE',
            delta: opening.quantity * (unit?.conversionRate ?? 1),
            documentType: 'LEGACY_OPENING_BALANCE',
            documentId: opening.id,
            comment: 'Перенесено из явного документа начальных остатков',
            idempotencyKey,
          },
        ),
      ];
    });
    if (migrations.length > 0) {
      await warehouse.appendBatch(
        context.projectId,
        context.businessEnvironmentId,
        migrations,
      );
    }
  }

  async function operationContext(
    context: WarehouseRuntimeContext,
    warehouseId: string,
  ) {
    const value = await access(context);
    if (!(value.workspace.assignedWarehouseIds ?? []).includes(warehouseId))
      throw new Error('warehouse-access-denied');
    const resourceList = resources(value.snapshot);
    return { ...value, resourceList };
  }

  async function appendQuantity(
    context: WarehouseRuntimeContext,
    input: WarehouseQuantityInput,
    type: WarehouseMovementType,
    documentType: string,
    comment: string,
  ): Promise<void> {
    const { snapshot, resourceList } = await operationContext(
      context,
      input.warehouseId,
    );
    const resource = resourceList.find(
      (candidate) => candidate.resourceId === input.resourceId && candidate.active,
    );
    if (!resource) throw new Error('resource-not-found');
    const delta =
      quantityBase(snapshot, resource, input.quantity, input.unitId) *
      (type === 'WRITE_OFF' ? -1 : 1);
    await warehouse.appendBatch(context.projectId, context.businessEnvironmentId, [
      movement(context, {
        warehouseId: input.warehouseId,
        resource,
        type,
        delta,
        documentType,
        documentId: input.idempotencyKey,
        comment,
        idempotencyKey: input.idempotencyKey,
      }),
    ]);
  }

  async function loadState(
    context: WarehouseRuntimeContext,
    allowPurchasing = false,
    allWarehouses = false,
  ): Promise<WarehouseState> {
    const { snapshot, workspace } = await access(
      context,
      false,
      allowPurchasing,
      allWarehouses,
    );
    await migrateExplicitOpeningBalances(context, snapshot);
    const store = await warehouse.load(
      context.projectId,
      context.businessEnvironmentId,
    );
    const allowed = new Set(
      allWarehouses
        ? snapshot.warehouses.map((physicalWarehouse) => physicalWarehouse.id)
        : (workspace.assignedWarehouseIds ?? []),
    );
    const warehouseList = snapshot.warehouses
      .filter((candidate) => allowed.has(candidate.id) && candidate.status === 'active')
      .map(({ id, name }) => ({ id, name }));
    const resourceList = resources(snapshot).filter((resource) => resource.active);
    const movements = store.movements.filter((entry) => allowed.has(entry.warehouseId));
    const balances: WarehouseBalance[] = warehouseList.flatMap((physicalWarehouse) =>
      resourceList.map((resource) => {
        const scoped = movements.filter(
          (entry) =>
            entry.warehouseId === physicalWarehouse.id &&
            entry.resourceId === resource.resourceId &&
            entry.resourceType === resource.resourceType,
        );
        const quantity = round(
          scoped.reduce((sum, entry) => sum + entry.quantityDeltaBase, 0),
        );
        const threshold = resource.minimumStockBase;
        return {
          warehouseId: physicalWarehouse.id,
          resource,
          quantityBase: quantity,
          lastMovementAt: scoped.at(-1)?.occurredAt ?? null,
          status:
            quantity < 0
              ? 'NEGATIVE'
              : quantity === 0
                ? 'OUT_OF_STOCK'
                : threshold !== null && quantity <= threshold
                  ? 'LOW'
                  : 'IN_STOCK',
        };
      }),
    );
    const employeeName =
      context.employeeId === 'owner-preview'
        ? 'Владелец · просмотр'
        : (snapshot.employees.find((employee) => employee.id === context.employeeId)
            ?.fullName ?? 'Сотрудник');
    return {
      employeeName,
      employees: snapshot.employees.map((employee) => ({
        id: employee.id,
        name: employee.fullName,
      })),
      warehouses: warehouseList,
      resources: resourceList,
      balances,
      movements,
      inventories: store.inventories.filter((entry) => allowed.has(entry.warehouseId)),
      issues: store.issues,
    };
  }

  return {
    load: (context) => loadState(context),
    async queryOperations(context) {
      const state = await loadState(context, false, true);
      const warehouseNames = new Map(
        state.warehouses.map((physicalWarehouse) => [
          physicalWarehouse.id,
          physicalWarehouse.name,
        ]),
      );
      const resourceNames = new Map(
        state.resources.map((resource) => [resource.resourceId, resource.name]),
      );
      return {
        warehouses: state.warehouses,
        resources: state.resources.map((resource) => ({
          resourceId: resource.resourceId,
          resourceType: resource.resourceType,
          name: resource.name,
          accountingType: resource.accountingType,
          baseUnit: resource.baseUnit,
          baseUnitId: resource.baseUnitId,
          purchaseUnitId: resource.purchaseUnitId,
          purchasePackageSize: resource.purchasePackageSize,
          minimumStockBase: resource.minimumStockBase,
          active: resource.active,
        })),
        balances: state.balances.map((balance) => ({
          warehouseId: balance.warehouseId,
          warehouseName: warehouseNames.get(balance.warehouseId) ?? 'Склад',
          resourceId: balance.resource.resourceId,
          resourceName: balance.resource.name,
          resourceType: balance.resource.resourceType,
          accountingType: balance.resource.accountingType,
          quantityBase: balance.quantityBase,
          baseUnit: balance.resource.baseUnit,
          baseUnitId: balance.resource.baseUnitId,
          purchaseUnitId: balance.resource.purchaseUnitId,
          purchasePackageSize: balance.resource.purchasePackageSize,
          minimumStockBase: balance.resource.minimumStockBase,
          status: balance.status,
        })),
        recentMovements: [...state.movements]
          .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
          .slice(0, 100)
          .map((warehouseMovement) => ({
            movementId: warehouseMovement.movementId,
            warehouseId: warehouseMovement.warehouseId,
            warehouseName: warehouseNames.get(warehouseMovement.warehouseId) ?? 'Склад',
            resourceId: warehouseMovement.resourceId,
            resourceName: resourceNames.get(warehouseMovement.resourceId) ?? 'Ресурс',
            movementType: warehouseMovement.movementType,
            quantityDeltaBase: warehouseMovement.quantityDeltaBase,
            baseUnit: warehouseMovement.baseUnit,
            sourceDocumentType: warehouseMovement.sourceDocumentType,
            sourceDocumentId: warehouseMovement.sourceDocumentId,
            occurredAt: warehouseMovement.occurredAt,
            employeeId: warehouseMovement.employeeId,
          })),
        issues: state.issues.map((issue) => ({
          issueId: issue.issueId,
          code: issue.code,
          message: issue.message,
          occurredAt: issue.occurredAt,
          resolved: issue.resolvedAt !== null,
        })),
      };
    },
    async recordSupplierDelivery(context, input) {
      const { snapshot, workspace } = await access(context, false, true);
      const allowed = new Set(workspace.assignedWarehouseIds ?? []);
      const destination = snapshot.warehouses.find(
        (candidate) =>
          candidate.id === input.destinationWarehouseId &&
          candidate.status === 'active' &&
          allowed.has(candidate.id),
      );
      if (!destination) throw new Error('warehouse-access-denied');
      if (
        input.lines.length === 0 ||
        input.lines.some(
          (line) => !Number.isFinite(line.quantityBase) || line.quantityBase <= 0,
        )
      )
        throw new Error('invalid-quantity');
      await warehouse.appendBatch(
        context.projectId,
        context.businessEnvironmentId,
        input.lines.map((line) =>
          movement(context, {
            warehouseId: destination.id,
            resource: {
              resourceId: line.resourceId,
              resourceType: line.resourceType,
              name: line.resourceName,
              accountingType:
                line.baseUnit === 'ml'
                  ? 'volume'
                  : line.baseUnit === 'pc'
                    ? 'pieces'
                    : 'weight',
              baseUnit: line.baseUnit,
              baseUnitId: line.baseUnit,
              purchaseUnitId: line.baseUnit,
              purchasePackageSize: 1,
              minimumStockBase: null,
              active: true,
            },
            type: 'RECEIPT',
            delta: line.quantityBase,
            documentType: 'SUPPLIER_DELIVERY',
            documentId: input.deliveryId,
            comment: [
              `Заказ поставщику ${input.supplierOrderId}`,
              input.supplierDocumentReference,
            ]
              .filter(Boolean)
              .join(' · '),
            idempotencyKey: `supplier-delivery:${input.deliveryId}:${line.deliveryLineId}`,
          }),
        ),
      );
    },
    recordOpeningBalance: (context, input) =>
      appendQuantity(
        context,
        input,
        'OPENING_BALANCE',
        'OPENING_BALANCE',
        input.comment ?? '',
      ),
    recordReceipt: (context, input) =>
      appendQuantity(
        context,
        input,
        'RECEIPT',
        'MANUAL_RECEIPT',
        [input.externalReference, input.comment].filter(Boolean).join(' · '),
      ),
    async recordWriteOff(context, input) {
      const state = await this.load(context);
      const resource = state.resources.find(
        (candidate) => candidate.resourceId === input.resourceId,
      );
      const { snapshot } = await operationContext(context, input.warehouseId);
      if (!resource) throw new Error('resource-not-found');
      const amount = quantityBase(snapshot, resource, input.quantity, input.unitId);
      const balance =
        state.balances.find(
          (entry) =>
            entry.warehouseId === input.warehouseId &&
            entry.resource.resourceId === input.resourceId,
        )?.quantityBase ?? 0;
      if (balance - amount < 0 && !input.confirmNegative)
        throw new Error('negative-confirmation-required');
      await appendQuantity(
        context,
        input,
        'WRITE_OFF',
        'MANUAL_WRITE_OFF',
        `${input.reason}${input.comment ? ` · ${input.comment}` : ''}`,
      );
    },
    async transfer(context, input) {
      if (input.sourceWarehouseId === input.destinationWarehouseId)
        throw new Error('same-warehouse');
      const source = await operationContext(context, input.sourceWarehouseId);
      await operationContext(context, input.destinationWarehouseId);
      const resource = source.resourceList.find(
        (candidate) => candidate.resourceId === input.resourceId,
      );
      if (!resource) throw new Error('resource-not-found');
      const amount = quantityBase(
        source.snapshot,
        resource,
        input.quantity,
        input.unitId,
      );
      const state = await this.load(context);
      const balance =
        state.balances.find(
          (entry) =>
            entry.warehouseId === input.sourceWarehouseId &&
            entry.resource.resourceId === input.resourceId,
        )?.quantityBase ?? 0;
      if (balance - amount < 0 && !input.confirmNegative)
        throw new Error('negative-confirmation-required');
      const documentId = createId();
      await warehouse.appendBatch(context.projectId, context.businessEnvironmentId, [
        movement(context, {
          warehouseId: input.sourceWarehouseId,
          resource,
          type: 'TRANSFER_OUT',
          delta: -amount,
          documentType: 'TRANSFER',
          documentId,
          comment: input.comment ?? '',
          idempotencyKey: `${input.idempotencyKey}:out`,
        }),
        movement(context, {
          warehouseId: input.destinationWarehouseId,
          resource,
          type: 'TRANSFER_IN',
          delta: amount,
          documentType: 'TRANSFER',
          documentId,
          comment: input.comment ?? '',
          idempotencyKey: `${input.idempotencyKey}:in`,
        }),
      ]);
    },
    async createInventory(context, warehouseId, comment = '') {
      const { resourceList } = await operationContext(context, warehouseId);
      const state = await this.load(context);
      const document: WarehouseInventoryDocument = {
        inventoryId: createId(),
        warehouseId,
        status: 'DRAFT',
        createdAt: now(),
        createdBy: context.employeeId,
        postedAt: null,
        postedBy: null,
        comment,
        lines: resourceList
          .filter((resource) => resource.active)
          .map((resource) => ({
            resourceId: resource.resourceId,
            resourceType: resource.resourceType,
            systemQuantityBase:
              state.balances.find(
                (entry) =>
                  entry.warehouseId === warehouseId &&
                  entry.resource.resourceId === resource.resourceId,
              )?.quantityBase ?? 0,
            actualQuantityBase: null,
            baseUnit: resource.baseUnit,
          })),
      };
      await warehouse.saveInventory(
        context.projectId,
        context.businessEnvironmentId,
        document,
      );
      return document;
    },
    async updateInventoryLine(
      context,
      inventoryId,
      resourceId,
      actualQuantity,
      unitId,
    ) {
      const state = await this.load(context);
      const inventory = state.inventories.find(
        (candidate) => candidate.inventoryId === inventoryId,
      );
      if (!inventory || inventory.status !== 'DRAFT')
        throw new Error('inventory-immutable');
      const { snapshot, resourceList } = await operationContext(
        context,
        inventory.warehouseId,
      );
      const resource = resourceList.find(
        (candidate) => candidate.resourceId === resourceId,
      );
      if (!resource) throw new Error('resource-not-found');
      const actualQuantityBase =
        actualQuantity === 0
          ? 0
          : quantityBase(snapshot, resource, actualQuantity, unitId);
      const updated = {
        ...inventory,
        lines: inventory.lines.map((line) =>
          line.resourceId === resourceId ? { ...line, actualQuantityBase } : line,
        ),
      };
      await warehouse.saveInventory(
        context.projectId,
        context.businessEnvironmentId,
        updated,
      );
      return updated;
    },
    async postInventory(context, inventoryId) {
      const state = await this.load(context);
      const inventory = state.inventories.find(
        (candidate) => candidate.inventoryId === inventoryId,
      );
      if (!inventory || inventory.status !== 'DRAFT')
        throw new Error('inventory-immutable');
      if (inventory.lines.some((line) => line.actualQuantityBase === null))
        throw new Error('inventory-incomplete');
      const timestamp = now();
      const movements = inventory.lines.flatMap((line) => {
        const difference = round(
          (line.actualQuantityBase ?? 0) - line.systemQuantityBase,
        );
        const resource = state.resources.find(
          (candidate) => candidate.resourceId === line.resourceId,
        );
        return !resource || difference === 0
          ? []
          : [
              movement(context, {
                warehouseId: inventory.warehouseId,
                resource,
                type: difference > 0 ? 'INVENTORY_SURPLUS' : 'INVENTORY_SHORTAGE',
                delta: difference,
                documentType: 'INVENTORY',
                documentId: inventory.inventoryId,
                comment: inventory.comment,
                idempotencyKey: `inventory:${inventory.inventoryId}:${line.resourceId}`,
              }),
            ];
      });
      await warehouse.appendBatch(
        context.projectId,
        context.businessEnvironmentId,
        movements,
      );
      await warehouse.saveInventory(context.projectId, context.businessEnvironmentId, {
        ...inventory,
        status: 'POSTED',
        postedAt: timestamp,
        postedBy: context.employeeId,
      });
    },
    async consumeCompletedOrder(context, order) {
      if (order.status !== 'COMPLETED') return;
      const { snapshot, workspace } = await access(context, true);
      await migrateExplicitOpeningBalances(context, snapshot);
      if (workspace.moduleId !== 'bar') return;
      const issue = async (
        code: WarehouseConsumptionIssue['code'],
        message: string,
        scope: 'bar' | 'kitchen',
      ): Promise<void> => {
        await warehouse.recordIssue(context.projectId, context.businessEnvironmentId, {
          issueId: `order:${order.orderId}:${scope}:${code}`,
          projectId: context.projectId,
          businessEnvironmentId: context.businessEnvironmentId,
          orderId: order.orderId,
          code,
          message,
          occurredAt: now(),
          resolvedAt: null,
        });
      };
      const resourceList = resources(snapshot);
      const kitchenWorkspace = snapshot.solutionStructure.workspaces.find(
        (candidate) =>
          candidate.moduleId === 'kitchen' && candidate.status === 'active',
      );

      const consumeRoute = async (
        scope: 'bar' | 'kitchen',
        sourceWarehouseId: string | null | undefined,
      ): Promise<void> => {
        const routedItems = order.items.filter((item) =>
          scope === 'kitchen'
            ? item.preparationWorkspace === 'KITCHEN'
            : item.preparationWorkspace !== 'KITCHEN',
        );
        if (routedItems.length === 0) return;
        if (!sourceWarehouseId) {
          await issue(
            'WAREHOUSE_NOT_ASSIGNED',
            scope === 'kitchen'
              ? 'Для рабочего пространства «Кухня» не назначен склад списания.'
              : 'Для рабочего пространства «Бар» не назначен склад списания.',
            scope,
          );
          return;
        }
        const source = snapshot.warehouses.find(
          (candidate) =>
            candidate.id === sourceWarehouseId && candidate.status === 'active',
        );
        if (!source) {
          await issue(
            'WAREHOUSE_NOT_ASSIGNED',
            'Назначенный склад списания недоступен.',
            scope,
          );
          return;
        }
        const totals = new Map<
          string,
          { resource: WarehouseStockResource; quantity: number }
        >();
        for (const item of routedItems) {
          const frozen = item.stockConsumptionSnapshot;
          const expanded = frozen
            ? frozen.issueCode
              ? { ok: false as const, code: frozen.issueCode }
              : {
                  ok: true as const,
                  requirements: frozen.requirements.map((requirement) => ({
                    resourceId: requirement.resourceId,
                    resourceType: requirement.resourceType,
                    baseUnit: requirement.baseUnit,
                    quantityBase: requirement.quantityBasePerItem * item.quantity,
                  })),
                }
            : expandCoffeeRecipe({
                snapshot,
                productId: item.productId,
                quantity: item.quantity,
                selectedModifiers: item.modifiers,
              });
          if (!expanded.ok) {
            await issue(
              expanded.code,
              expanded.code === 'RECIPE_CYCLE'
                ? 'Обнаружен цикл рецептуры.'
                : `Не найдена активная рецептура для «${item.productName}».`,
              scope,
            );
            return;
          }
          for (const requirement of expanded.requirements) {
            const resource = resourceList.find(
              (candidate) => candidate.resourceId === requirement.resourceId,
            );
            if (!resource) {
              await issue(
                'RECIPE_NOT_FOUND',
                `Ресурс рецептуры ${requirement.resourceId} не найден.`,
                scope,
              );
              return;
            }
            const key = `${requirement.resourceType}:${requirement.resourceId}`;
            const current = totals.get(key);
            totals.set(key, {
              resource,
              quantity: (current?.quantity ?? 0) + requirement.quantityBase,
            });
          }
        }
        await warehouse.appendBatch(
          context.projectId,
          context.businessEnvironmentId,
          [...totals.values()].map(({ resource, quantity }) =>
            movement(context, {
              warehouseId: source.id,
              resource,
              type: 'SALE_CONSUMPTION',
              delta: -quantity,
              documentType: 'BAR_ORDER',
              documentId: order.orderId,
              comment: `Заказ ${order.orderNumber}`,
              idempotencyKey: `sale:${order.orderId}:${scope}:${resource.resourceType}:${resource.resourceId}`,
            }),
          ),
        );
      };

      await consumeRoute('bar', workspace.sourceWarehouseId);
      await consumeRoute('kitchen', kitchenWorkspace?.sourceWarehouseId);
    },
    subscribe: (context, listener) => warehouse.subscribe(context.projectId, listener),
  };
}

export const localCoffeeWarehouseService = createCoffeeWarehouseService({
  operational: localCoffeeOperationalReadRepository,
  warehouse: localCoffeeWarehouseRepository,
});
