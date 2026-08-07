'use client';

import type { MediaAssetId } from '@barakasb/contracts-platform';
import type { MediaAssetService } from '@barakasb/frontend-media';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  BusinessProfile,
  CoffeeCapability,
  CoffeeRoleId,
  CoffeeSettings,
  CoffeeSnapshot,
  CollectionEntity,
  CollectionKey,
  EntityStatus,
  FormValues,
  Recipe,
  RecipeComponent,
  RecipeTarget,
  SetupStep,
} from './domain';
import type { CoffeeTranslationKey } from './i18n';
import { recipeNetQuantity, recipeTitle } from './recipe-migration';
import {
  baseUnitForAccountingType,
  type IngredientAccountingType,
} from './ingredient-migration';
import { localCoffeeManagerRepositories } from './repositories';
import {
  resourceDeletionDependencies,
  type ResourceDependency,
} from './resource-deletion';
import {
  CoffeeRepositoryError,
  type CoffeeManagerRepositories,
} from './repository-contracts';

interface CoffeeWorkspaceContextValue {
  projectId: string;
  mediaAssets: MediaAssetService;
  removeMediaIfUnreferenced: (assetId: MediaAssetId) => Promise<boolean>;
  snapshot: CoffeeSnapshot | null;
  loading: boolean;
  error: CoffeeRepositoryError | null;
  feedbackKey: CoffeeTranslationKey | null;
  reload: () => Promise<void>;
  clearFeedback: () => void;
  can: (capability: CoffeeCapability) => boolean;
  createResource: (kind: CollectionKey, values: FormValues) => Promise<void>;
  updateResource: (
    kind: CollectionKey,
    id: string,
    values: FormValues,
  ) => Promise<void>;
  duplicateResource: (
    kind: CollectionKey,
    id: string,
    copySuffix: string,
  ) => Promise<void>;
  toggleResourceStatus: (kind: CollectionKey, id: string) => Promise<void>;
  deletionDependencies: (kind: CollectionKey, id: string) => ResourceDependency[];
  removeResource: (kind: CollectionKey, id: string) => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  saveSettings: (settings: CoffeeSettings) => Promise<void>;
  setDefaultLocation: (locationId: string) => Promise<void>;
  assignRole: (employeeId: string, roleId: CoffeeRoleId | null) => Promise<void>;
  completeSetupStep: (stepId: SetupStep['id']) => Promise<void>;
  markReady: () => Promise<void>;
  setPreviewRole: (roleId: CoffeeRoleId) => Promise<void>;
}

const CoffeeWorkspaceContext = createContext<CoffeeWorkspaceContextValue | null>(null);

const value = (values: FormValues, key: string): string => values[key]?.trim() ?? '';
const numeric = (values: FormValues, key: string): number =>
  Number.parseFloat(value(values, key)) || 0;

function recipeTargetFrom(
  values: FormValues,
  snapshot: CoffeeSnapshot,
  existing?: Recipe,
): RecipeTarget {
  let parsed: Partial<RecipeTarget>;
  try {
    parsed = JSON.parse(value(values, 'target')) as Partial<RecipeTarget>;
  } catch {
    throw new CoffeeRepositoryError('invalid-operation');
  }
  if (parsed.type === 'menu-item') {
    const menuItem = snapshot.menuItems.find((item) => item.id === parsed.id);
    if (!menuItem) throw new CoffeeRepositoryError('invalid-operation');
    return { type: 'menu-item', id: menuItem.id, name: menuItem.name };
  }
  if (parsed.type !== 'preparation' && parsed.type !== 'semi-finished') {
    throw new CoffeeRepositoryError('invalid-operation');
  }
  const name = parsed.name?.trim() ?? '';
  if (!name) throw new CoffeeRepositoryError('invalid-operation');
  const existingTargetId =
    existing?.target.type === parsed.type ? existing.target.id : '';
  return {
    type: parsed.type,
    id:
      parsed.id?.trim() ||
      existingTargetId ||
      `recipe-target-${globalThis.crypto.randomUUID()}`,
    name,
  };
}

function recipeComponentsFrom(values: FormValues): RecipeComponent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value(values, 'components'));
  } catch {
    throw new CoffeeRepositoryError('invalid-operation');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new CoffeeRepositoryError('invalid-operation');
  }
  return (parsed as RecipeComponent[]).map((component) => ({
    ...component,
    netQuantity: recipeNetQuantity(
      Number(component.grossQuantity),
      Number(component.lossPercentage),
    ),
  }));
}

const mediaAssetId = (values: FormValues, key: string): MediaAssetId | null => {
  const identifier = value(values, key);
  return identifier ? (identifier as MediaAssetId) : null;
};

function statusFrom(values: FormValues, fallback: EntityStatus): EntityStatus {
  const next = value(values, 'status');
  return next === 'active' || next === 'inactive' || next === 'draft' ? next : fallback;
}

function arrayValue(values: FormValues, key: string): string[] {
  return value(values, key)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function preparationVisibilityValue(values: FormValues): 'all' | 'bar' | 'kitchen' {
  const visibility = value(values, 'preparationVisibility');
  return visibility === 'bar' || visibility === 'kitchen' ? visibility : 'all';
}

function createName(values: FormValues): string {
  return value(values, 'name') || value(values, 'fullName');
}

export function generateMenuItemSku(existingSkus: readonly string[]): string {
  const occupied = new Set(existingSkus.map((sku) => sku.trim().toUpperCase()));
  let sequence = 1;
  while (occupied.has(`MENU-${String(sequence).padStart(4, '0')}`)) {
    sequence += 1;
  }
  return `MENU-${String(sequence).padStart(4, '0')}`;
}

export function generateIngredientSku(existingSkus: readonly string[]): string {
  const occupied = new Set(existingSkus.map((sku) => sku.trim().toUpperCase()));
  let sequence = 1;
  while (occupied.has(`ING-${String(sequence).padStart(4, '0')}`)) {
    sequence += 1;
  }
  return `ING-${String(sequence).padStart(4, '0')}`;
}

function ingredientAccountingType(values: FormValues): IngredientAccountingType {
  const type = value(values, 'accountingType');
  if (type === 'weight' || type === 'volume' || type === 'pieces') return type;
  throw new CoffeeRepositoryError('invalid-operation');
}

export async function removeCoffeeMediaIfUnreferenced(
  repositories: CoffeeManagerRepositories,
  projectId: string,
  assetId: MediaAssetId,
): Promise<boolean> {
  const [menuItems, menuCategories] = await Promise.all([
    repositories.menuItems.list(projectId),
    repositories.menuCategories.list(projectId),
  ]);
  if (
    menuItems.some((item) => item.imageAssetId === assetId) ||
    menuCategories.some((category) => category.imageAssetId === assetId)
  ) {
    return false;
  }
  await repositories.mediaAssets.remove(projectId, assetId);
  return true;
}

function inheritedTaxCategory(snapshot: CoffeeSnapshot): string {
  return snapshot.businessProfile.taxMode || snapshot.settings.taxMode;
}

function currentLocationId(snapshot: CoffeeSnapshot): string {
  return snapshot.project.defaultLocationId ?? snapshot.locations[0]?.id ?? '';
}

export function CoffeeWorkspaceProvider({
  projectId,
  projectName,
  repositories = localCoffeeManagerRepositories,
  children,
}: {
  projectId: string;
  projectName: string;
  repositories?: CoffeeManagerRepositories;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<CoffeeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CoffeeRepositoryError | null>(null);
  const [feedbackKey, setFeedbackKey] = useState<CoffeeTranslationKey | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await repositories.coffeeProject.initialize(projectId, projectName);
      setSnapshot(await repositories.loadSnapshot(projectId));
    } catch (caught) {
      setError(
        caught instanceof CoffeeRepositoryError
          ? caught
          : new CoffeeRepositoryError('corrupt-data'),
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, projectName, repositories]);

  useEffect(() => {
    let active = true;
    void repositories.coffeeProject
      .initialize(projectId, projectName)
      .then(() => repositories.loadSnapshot(projectId))
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof CoffeeRepositoryError
            ? caught
            : new CoffeeRepositoryError('corrupt-data'),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, projectName, repositories]);

  const refreshAfter = useCallback(
    async (operation: () => Promise<void>, successKey: CoffeeTranslationKey) => {
      setError(null);
      try {
        await operation();
        setSnapshot(await repositories.loadSnapshot(projectId));
        setFeedbackKey(successKey);
      } catch (caught) {
        const repositoryError =
          caught instanceof CoffeeRepositoryError
            ? caught
            : new CoffeeRepositoryError('invalid-operation');
        setError(repositoryError);
        throw repositoryError;
      }
    },
    [projectId, repositories],
  );

  const createResource = useCallback(
    async (kind: CollectionKey, values: FormValues) => {
      const status = statusFrom(values, 'active');
      const common = { name: createName(values), status };
      await refreshAfter(async () => {
        switch (kind) {
          case 'locations':
            await repositories.locations.create(projectId, {
              ...common,
              code: value(values, 'code'),
              locationType: value(values, 'locationType'),
              address: value(values, 'address'),
              timezone: value(values, 'timezone'),
              currency: value(values, 'currency'),
              phone: value(values, 'phone'),
              email: value(values, 'email'),
              openingHours: value(values, 'openingHours'),
              isDefault: snapshot?.locations.length === 0,
            });
            break;
          case 'registers':
            await repositories.registers.create(projectId, {
              ...common,
              code: value(values, 'code'),
              locationId: value(values, 'locationId'),
              receiptPrinter: value(values, 'receiptPrinter'),
              cashDrawer: value(values, 'cashDrawer'),
              paymentMethods: value(values, 'paymentMethods'),
            });
            break;
          case 'workstations': {
            const workstationType = value(values, 'workstationType');
            await repositories.workstations.create(projectId, {
              ...common,
              workstationType:
                workstationType === 'barista' ||
                workstationType === 'kitchen' ||
                workstationType === 'inventory' ||
                workstationType === 'manager'
                  ? workstationType
                  : 'pos',
              locationId: value(values, 'locationId'),
              registerId: value(values, 'registerId'),
              printer: value(values, 'printer'),
              enabledModules: value(values, 'enabledModules'),
            });
            break;
          }
          case 'menuCategories': {
            if (!snapshot) throw new CoffeeRepositoryError('not-found');
            await repositories.menuCategories.create(projectId, {
              ...common,
              description: value(values, 'description'),
              displayOrder: numeric(values, 'displayOrder'),
              locationAvailability:
                snapshot.locations.length === 1
                  ? (snapshot.locations[0]?.id ?? '')
                  : value(values, 'locationAvailability'),
              imageAssetId: null,
            });
            break;
          }
          case 'menuItems': {
            if (!snapshot) throw new CoffeeRepositoryError('not-found');
            await repositories.menuItems.create(projectId, {
              ...common,
              categoryId: value(values, 'categoryId'),
              description: value(values, 'description'),
              sku: generateMenuItemSku(snapshot.menuItems.map((item) => item.sku)),
              barcode: value(values, 'barcode'),
              sellingPrice: numeric(values, 'sellingPrice'),
              taxCategory: inheritedTaxCategory(snapshot),
              locationAvailability: currentLocationId(snapshot),
              imageAssetId: mediaAssetId(values, 'imageAssetId'),
              recipeId: value(values, 'recipeId'),
              modifierGroupIds: arrayValue(values, 'modifierGroupIds'),
            });
            break;
          }
          case 'modifiers':
            await repositories.modifiers.create(projectId, {
              ...common,
              purpose:
                value(values, 'purpose') === 'additional'
                  ? 'additional'
                  : 'configuration',
              selectionType:
                value(values, 'selectionType') === 'multiple' ? 'multiple' : 'single',
              preparationVisibility: preparationVisibilityValue(values),
              required: value(values, 'required') === 'true',
              minimumSelections: numeric(values, 'minimumSelections'),
              maximumSelections: numeric(values, 'maximumSelections'),
              options: value(values, 'options'),
            });
            break;
          case 'recipes':
            if (!snapshot) throw new CoffeeRepositoryError('not-found');
            {
              const target = recipeTargetFrom(values, snapshot);
              await repositories.recipes.create(projectId, {
                ...common,
                name: recipeTitle(target),
                target,
                outputQuantity: numeric(values, 'outputQuantity'),
                outputUnitId: value(values, 'outputUnitId'),
                preparationInstructions: value(values, 'preparationInstructions'),
                components: recipeComponentsFrom(values),
              });
            }
            break;
          case 'ingredients': {
            if (!snapshot) throw new CoffeeRepositoryError('not-found');
            const accountingType = ingredientAccountingType(values);
            const baseUnit = baseUnitForAccountingType(accountingType, snapshot.units);
            if (!baseUnit) throw new CoffeeRepositoryError('invalid-operation');
            const purchasePackageSize = numeric(values, 'purchasePackageSize');
            await repositories.ingredients.create(projectId, {
              ...common,
              sku: generateIngredientSku(
                snapshot.ingredients.map((ingredient) => ingredient.sku),
              ),
              category: value(values, 'category'),
              accountingType,
              baseUnitId: baseUnit.id,
              purchaseUnitId: value(values, 'purchaseUnitId'),
              purchasePackageSize,
              conversionRate: purchasePackageSize,
              barcode: value(values, 'barcode'),
              minimumStock: 0,
              cost: 0,
              supplierReferences: '',
            });
            break;
          }
          case 'units':
            await repositories.units.create(projectId, {
              ...common,
              symbol: value(values, 'symbol'),
              dimension: value(values, 'dimension'),
              conversionTargetId: value(values, 'conversionTargetId'),
              conversionRate: numeric(values, 'conversionRate'),
            });
            break;
          case 'warehouses':
            await repositories.warehouses.create(projectId, {
              ...common,
              code: value(values, 'code'),
              locationId: value(values, 'locationId'),
              warehouseType: value(values, 'warehouseType'),
              addressOrZone: value(values, 'addressOrZone'),
              responsibleEmployeeId: value(values, 'responsibleEmployeeId'),
            });
            break;
          case 'suppliers':
            await repositories.suppliers.create(projectId, {
              ...common,
              contactPerson: value(values, 'contactPerson'),
              phone: value(values, 'phone'),
              email: value(values, 'email'),
              address: value(values, 'address'),
              taxIdentifier: value(values, 'taxIdentifier'),
              paymentTerms: value(values, 'paymentTerms'),
              deliverySchedule: value(values, 'deliverySchedule'),
              suppliedIngredients: value(values, 'suppliedIngredients'),
            });
            break;
          case 'employees': {
            const employmentStatus = value(values, 'employmentStatus');
            const assignedRole = value(values, 'assignedRoleId');
            const fullName = value(values, 'fullName').trim();
            const [firstName = '', ...lastNameParts] = fullName.split(/\s+/);
            await repositories.employees.create(projectId, {
              ...common,
              firstName,
              lastName: lastNameParts.join(' '),
              position: '',
              fullName,
              email: value(values, 'email'),
              phone: value(values, 'phone'),
              employeeCode: value(values, 'employeeCode'),
              assignedLocationIds: arrayValue(values, 'assignedLocationIds'),
              assignedRoleId: isRoleId(assignedRole) ? assignedRole : null,
              employmentStatus:
                employmentStatus === 'active' || employmentStatus === 'inactive'
                  ? employmentStatus
                  : 'invited',
              hireDate: value(values, 'hireDate'),
              notes: value(values, 'notes'),
            });
            break;
          }
        }
      }, 'resource.successCreated');
    },
    [projectId, refreshAfter, repositories, snapshot],
  );

  const updateResource = useCallback(
    async (kind: CollectionKey, id: string, values: FormValues) => {
      const existing = snapshot?.[kind].find((item) => item.id === id);
      if (!existing) throw new CoffeeRepositoryError('not-found');
      const status = statusFrom(values, existing.status);
      const common = { name: createName(values), status };
      await refreshAfter(async () => {
        switch (kind) {
          case 'locations':
            await repositories.locations.update(projectId, id, {
              ...common,
              code: value(values, 'code'),
              locationType: value(values, 'locationType'),
              address: value(values, 'address'),
              timezone: value(values, 'timezone'),
              currency: value(values, 'currency'),
              phone: value(values, 'phone'),
              email: value(values, 'email'),
              openingHours: value(values, 'openingHours'),
            });
            break;
          case 'registers':
            await repositories.registers.update(projectId, id, {
              ...common,
              code: value(values, 'code'),
              locationId: value(values, 'locationId'),
              receiptPrinter: value(values, 'receiptPrinter'),
              cashDrawer: value(values, 'cashDrawer'),
              paymentMethods: value(values, 'paymentMethods'),
            });
            break;
          case 'workstations': {
            const workstationType = value(values, 'workstationType');
            await repositories.workstations.update(projectId, id, {
              ...common,
              workstationType:
                workstationType === 'barista' ||
                workstationType === 'kitchen' ||
                workstationType === 'inventory' ||
                workstationType === 'manager'
                  ? workstationType
                  : 'pos',
              locationId: value(values, 'locationId'),
              registerId: value(values, 'registerId'),
              printer: value(values, 'printer'),
              enabledModules: value(values, 'enabledModules'),
            });
            break;
          }
          case 'menuCategories': {
            const existingCategory = snapshot?.menuCategories.find(
              (category) => category.id === id,
            );
            if (!existingCategory) throw new CoffeeRepositoryError('not-found');
            await repositories.menuCategories.update(projectId, id, {
              ...common,
              description: existingCategory.description,
              displayOrder: numeric(values, 'displayOrder'),
              locationAvailability: value(values, 'locationAvailability'),
              imageAssetId: existingCategory.imageAssetId,
            });
            break;
          }
          case 'menuItems': {
            const existingMenuItem = snapshot?.menuItems.find((item) => item.id === id);
            if (!snapshot || !existingMenuItem) {
              throw new CoffeeRepositoryError('not-found');
            }
            const nextImageAssetId = mediaAssetId(values, 'imageAssetId');
            await repositories.menuItems.update(projectId, id, {
              ...common,
              categoryId: value(values, 'categoryId'),
              description: existingMenuItem.description,
              sku: existingMenuItem.sku,
              barcode: value(values, 'barcode'),
              sellingPrice: numeric(values, 'sellingPrice'),
              taxCategory: inheritedTaxCategory(snapshot),
              locationAvailability: existingMenuItem.locationAvailability,
              imageAssetId: nextImageAssetId,
              recipeId: value(values, 'recipeId'),
              modifierGroupIds: arrayValue(values, 'modifierGroupIds'),
            });
            if (
              existingMenuItem.imageAssetId &&
              existingMenuItem.imageAssetId !== nextImageAssetId
            ) {
              await removeCoffeeMediaIfUnreferenced(
                repositories,
                projectId,
                existingMenuItem.imageAssetId,
              );
            }
            break;
          }
          case 'modifiers':
            await repositories.modifiers.update(projectId, id, {
              ...common,
              purpose:
                value(values, 'purpose') === 'additional'
                  ? 'additional'
                  : 'configuration',
              selectionType:
                value(values, 'selectionType') === 'multiple' ? 'multiple' : 'single',
              preparationVisibility: preparationVisibilityValue(values),
              required: value(values, 'required') === 'true',
              minimumSelections: numeric(values, 'minimumSelections'),
              maximumSelections: numeric(values, 'maximumSelections'),
              options: value(values, 'options'),
            });
            break;
          case 'recipes':
            if (!snapshot || existing.id !== id) {
              throw new CoffeeRepositoryError('not-found');
            }
            {
              const existingRecipe = existing as Recipe;
              const target = recipeTargetFrom(values, snapshot, existingRecipe);
              await repositories.recipes.update(projectId, id, {
                ...common,
                name: recipeTitle(target),
                target,
                outputQuantity: numeric(values, 'outputQuantity'),
                outputUnitId: value(values, 'outputUnitId'),
                preparationInstructions: value(values, 'preparationInstructions'),
                components: recipeComponentsFrom(values),
              });
            }
            break;
          case 'ingredients': {
            if (!snapshot) throw new CoffeeRepositoryError('not-found');
            const existingIngredient = snapshot.ingredients.find(
              (ingredient) => ingredient.id === id,
            );
            if (!existingIngredient) throw new CoffeeRepositoryError('not-found');
            const accountingType = ingredientAccountingType(values);
            const baseUnit = baseUnitForAccountingType(accountingType, snapshot.units);
            if (!baseUnit) throw new CoffeeRepositoryError('invalid-operation');
            const purchasePackageSize = numeric(values, 'purchasePackageSize');
            await repositories.ingredients.update(projectId, id, {
              ...common,
              sku: existingIngredient.sku,
              category: value(values, 'category'),
              accountingType,
              baseUnitId: baseUnit.id,
              purchaseUnitId: value(values, 'purchaseUnitId'),
              purchasePackageSize,
              conversionRate: purchasePackageSize,
              barcode: value(values, 'barcode'),
              minimumStock: existingIngredient.minimumStock,
              cost: existingIngredient.cost,
              supplierReferences: existingIngredient.supplierReferences,
              ...(existingIngredient.preferredSupplierId
                ? { preferredSupplierId: existingIngredient.preferredSupplierId }
                : {}),
              ...(existingIngredient.reorderQuantity !== undefined
                ? { reorderQuantity: existingIngredient.reorderQuantity }
                : {}),
              ...(existingIngredient.storageLocationId
                ? { storageLocationId: existingIngredient.storageLocationId }
                : {}),
              accountingConfigurationWarning: undefined,
            });
            break;
          }
          case 'units':
            await repositories.units.update(projectId, id, {
              ...common,
              symbol: value(values, 'symbol'),
              dimension: value(values, 'dimension'),
              conversionTargetId: value(values, 'conversionTargetId'),
              conversionRate: numeric(values, 'conversionRate'),
            });
            break;
          case 'warehouses':
            await repositories.warehouses.update(projectId, id, {
              ...common,
              code: value(values, 'code'),
              locationId: value(values, 'locationId'),
              warehouseType: value(values, 'warehouseType'),
              addressOrZone: value(values, 'addressOrZone'),
              responsibleEmployeeId: value(values, 'responsibleEmployeeId'),
            });
            break;
          case 'suppliers':
            await repositories.suppliers.update(projectId, id, {
              ...common,
              contactPerson: value(values, 'contactPerson'),
              phone: value(values, 'phone'),
              email: value(values, 'email'),
              address: value(values, 'address'),
              taxIdentifier: value(values, 'taxIdentifier'),
              paymentTerms: value(values, 'paymentTerms'),
              deliverySchedule: value(values, 'deliverySchedule'),
              suppliedIngredients: value(values, 'suppliedIngredients'),
            });
            break;
          case 'employees': {
            const assignedRole = value(values, 'assignedRoleId');
            const employmentStatus = value(values, 'employmentStatus');
            const fullName = value(values, 'fullName').trim();
            const [firstName = '', ...lastNameParts] = fullName.split(/\s+/);
            await repositories.employees.update(projectId, id, {
              ...common,
              firstName,
              lastName: lastNameParts.join(' '),
              fullName,
              email: value(values, 'email'),
              phone: value(values, 'phone'),
              employeeCode: value(values, 'employeeCode'),
              assignedLocationIds: arrayValue(values, 'assignedLocationIds'),
              assignedRoleId: isRoleId(assignedRole) ? assignedRole : null,
              employmentStatus:
                employmentStatus === 'active' || employmentStatus === 'inactive'
                  ? employmentStatus
                  : 'invited',
              hireDate: value(values, 'hireDate'),
              notes: value(values, 'notes'),
            });
            break;
          }
        }
      }, 'resource.successUpdated');
    },
    [projectId, refreshAfter, repositories, snapshot],
  );

  const duplicateResource = useCallback(
    async (kind: CollectionKey, id: string, copySuffix: string) => {
      const entity = snapshot?.[kind].find((item) => item.id === id);
      if (!entity) throw new CoffeeRepositoryError('not-found');
      const values = entityToValues(entity);
      values.name = `${entity.name} · ${copySuffix}`;
      await createResource(kind, values);
      setFeedbackKey('resource.successDuplicated');
    },
    [createResource, snapshot],
  );

  const toggleResourceStatus = useCallback(
    async (kind: CollectionKey, id: string) => {
      const entity = snapshot?.[kind].find((item) => item.id === id);
      if (!entity) throw new CoffeeRepositoryError('not-found');
      const values = entityToValues(entity);
      values.status = entity.status === 'active' ? 'inactive' : 'active';
      await updateResource(kind, id, values);
      setFeedbackKey('resource.successStatus');
    },
    [snapshot, updateResource],
  );

  const deletionDependencies = useCallback(
    (kind: CollectionKey, id: string): ResourceDependency[] =>
      snapshot ? resourceDeletionDependencies(snapshot, kind, id) : [],
    [snapshot],
  );

  const removeResource = useCallback(
    async (kind: CollectionKey, id: string) => {
      if (!snapshot) throw new CoffeeRepositoryError('not-found');
      if (resourceDeletionDependencies(snapshot, kind, id).length > 0) {
        throw new CoffeeRepositoryError('invalid-operation');
      }
      await refreshAfter(async () => {
        if (kind === 'employees') {
          await repositories.employeeCredentials.remove(projectId, id);
        }
        await repositories[kind].remove(projectId, id);
      }, 'resource.successDeleted');
    },
    [projectId, refreshAfter, repositories, snapshot],
  );

  const saveBusinessProfile = useCallback(
    async (profile: BusinessProfile) => {
      await refreshAfter(async () => {
        await repositories.businessProfile.update(projectId, profile);
      }, 'common.saved');
    },
    [projectId, refreshAfter, repositories],
  );

  const setDefaultLocation = useCallback(
    async (locationId: string) => {
      await refreshAfter(async () => {
        await repositories.coffeeProject.setDefaultLocation(projectId, locationId);
      }, 'locations.defaultSuccess');
    },
    [projectId, refreshAfter, repositories],
  );

  const saveSettings = useCallback(
    async (settings: CoffeeSettings) => {
      await refreshAfter(async () => {
        await repositories.settings.update(projectId, settings);
      }, 'settings.saved');
    },
    [projectId, refreshAfter, repositories],
  );

  const assignRole = useCallback(
    async (employeeId: string, roleId: CoffeeRoleId | null) => {
      await refreshAfter(async () => {
        await repositories.roles.assign(projectId, employeeId, roleId);
      }, 'roles.assignSuccess');
    },
    [projectId, refreshAfter, repositories],
  );

  const completeSetupStep = useCallback(
    async (stepId: SetupStep['id']) => {
      await refreshAfter(async () => {
        await repositories.setupChecklist.complete(projectId, stepId);
      }, 'common.saved');
    },
    [projectId, refreshAfter, repositories],
  );

  const markReady = useCallback(async () => {
    await refreshAfter(async () => {
      await repositories.coffeeProject.markReady(projectId);
    }, 'setup.readySuccess');
  }, [projectId, refreshAfter, repositories]);

  const setPreviewRole = useCallback(
    async (roleId: CoffeeRoleId) => {
      await refreshAfter(async () => {
        await repositories.permissions.setPreviewRole(projectId, roleId);
      }, 'common.saved');
    },
    [projectId, refreshAfter, repositories],
  );

  const removeMediaIfUnreferenced = useCallback(
    (assetId: MediaAssetId) =>
      removeCoffeeMediaIfUnreferenced(repositories, projectId, assetId),
    [projectId, repositories],
  );

  const can = useCallback(
    (capability: CoffeeCapability): boolean => {
      const role = snapshot?.roles.find((item) => item.id === snapshot.currentRoleId);
      return role?.capabilities.includes(capability) ?? false;
    },
    [snapshot],
  );

  const contextValue = useMemo<CoffeeWorkspaceContextValue>(
    () => ({
      projectId,
      mediaAssets: repositories.mediaAssets,
      removeMediaIfUnreferenced,
      snapshot,
      loading,
      error,
      feedbackKey,
      reload,
      clearFeedback: () => setFeedbackKey(null),
      can,
      createResource,
      updateResource,
      duplicateResource,
      toggleResourceStatus,
      deletionDependencies,
      removeResource,
      saveBusinessProfile,
      saveSettings,
      setDefaultLocation,
      assignRole,
      completeSetupStep,
      markReady,
      setPreviewRole,
    }),
    [
      projectId,
      repositories.mediaAssets,
      removeMediaIfUnreferenced,
      snapshot,
      loading,
      error,
      feedbackKey,
      reload,
      can,
      createResource,
      updateResource,
      duplicateResource,
      toggleResourceStatus,
      deletionDependencies,
      removeResource,
      saveBusinessProfile,
      saveSettings,
      setDefaultLocation,
      assignRole,
      completeSetupStep,
      markReady,
      setPreviewRole,
    ],
  );

  return (
    <CoffeeWorkspaceContext.Provider value={contextValue}>
      {children}
    </CoffeeWorkspaceContext.Provider>
  );
}

export function useCoffeeWorkspace(): CoffeeWorkspaceContextValue {
  const context = useContext(CoffeeWorkspaceContext);
  if (!context) {
    throw new Error('Coffee UI must be rendered inside CoffeeWorkspaceProvider');
  }
  return context;
}

export function entityToValues(entity: CollectionEntity): FormValues {
  const values: FormValues = {};
  for (const [key, current] of Object.entries(entity)) {
    if (Array.isArray(current)) {
      values[key] = current.some((item) => typeof item === 'object')
        ? JSON.stringify(current)
        : current.join(',');
    } else if (typeof current === 'boolean') values[key] = String(current);
    else if (typeof current === 'number') values[key] = String(current);
    else if (typeof current === 'string') values[key] = current;
    else if (current && typeof current === 'object') {
      values[key] = JSON.stringify(current);
    }
  }
  return values;
}

function isRoleId(valueToCheck: string): valueToCheck is CoffeeRoleId {
  return [
    'owner',
    'administrator',
    'location-manager',
    'cashier',
    'barista',
    'kitchen',
    'inventory',
    'finance',
    'analyst',
  ].includes(valueToCheck);
}
