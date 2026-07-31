'use client';

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
  SetupStep,
} from './domain';
import type { CoffeeTranslationKey } from './i18n';
import { localCoffeeRepositories } from './repositories';
import { CoffeeRepositoryError, type CoffeeRepositories } from './repository-contracts';

interface CoffeeWorkspaceContextValue {
  projectId: string;
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

function createName(values: FormValues): string {
  return value(values, 'name') || value(values, 'fullName');
}

export function CoffeeWorkspaceProvider({
  projectId,
  projectName,
  repositories = localCoffeeRepositories,
  children,
}: {
  projectId: string;
  projectName: string;
  repositories?: CoffeeRepositories;
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
          case 'menuCategories':
            await repositories.menuCategories.create(projectId, {
              ...common,
              description: value(values, 'description'),
              displayOrder: numeric(values, 'displayOrder'),
              locationAvailability: value(values, 'locationAvailability'),
              imagePlaceholder: value(values, 'imagePlaceholder'),
            });
            break;
          case 'menuItems':
            await repositories.menuItems.create(projectId, {
              ...common,
              categoryId: value(values, 'categoryId'),
              description: value(values, 'description'),
              sku: value(values, 'sku'),
              barcode: value(values, 'barcode'),
              sellingPrice: numeric(values, 'sellingPrice'),
              taxCategory: value(values, 'taxCategory'),
              locationAvailability: value(values, 'locationAvailability'),
              imagePlaceholder: value(values, 'imagePlaceholder'),
              recipeId: value(values, 'recipeId'),
              modifierGroupIds: arrayValue(values, 'modifierGroupIds'),
            });
            break;
          case 'modifiers':
            await repositories.modifiers.create(projectId, {
              ...common,
              selectionType:
                value(values, 'selectionType') === 'multiple' ? 'multiple' : 'single',
              required: value(values, 'required') === 'true',
              minimumSelections: numeric(values, 'minimumSelections'),
              maximumSelections: numeric(values, 'maximumSelections'),
              options: value(values, 'options'),
            });
            break;
          case 'recipes':
            await repositories.recipes.create(projectId, {
              ...common,
              menuItemId: value(values, 'menuItemId'),
              outputQuantity: numeric(values, 'outputQuantity'),
              outputUnitId: value(values, 'outputUnitId'),
              preparationInstructions: value(values, 'preparationInstructions'),
              ingredientId: value(values, 'ingredientId'),
              ingredientQuantity: numeric(values, 'ingredientQuantity'),
              ingredientUnitId: value(values, 'ingredientUnitId'),
              wastePercentage: numeric(values, 'wastePercentage'),
            });
            break;
          case 'ingredients':
            await repositories.ingredients.create(projectId, {
              ...common,
              sku: value(values, 'sku'),
              category: value(values, 'category'),
              baseUnitId: value(values, 'baseUnitId'),
              purchaseUnitId: value(values, 'purchaseUnitId'),
              conversionRate: numeric(values, 'conversionRate'),
              minimumStock: numeric(values, 'minimumStock'),
              cost: numeric(values, 'cost'),
              supplierReferences: value(values, 'supplierReferences'),
            });
            break;
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
            await repositories.employees.create(projectId, {
              ...common,
              fullName: value(values, 'fullName'),
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
    [projectId, refreshAfter, repositories, snapshot?.locations.length],
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
          case 'menuCategories':
            await repositories.menuCategories.update(projectId, id, {
              ...common,
              description: value(values, 'description'),
              displayOrder: numeric(values, 'displayOrder'),
              locationAvailability: value(values, 'locationAvailability'),
              imagePlaceholder: value(values, 'imagePlaceholder'),
            });
            break;
          case 'menuItems':
            await repositories.menuItems.update(projectId, id, {
              ...common,
              categoryId: value(values, 'categoryId'),
              description: value(values, 'description'),
              sku: value(values, 'sku'),
              barcode: value(values, 'barcode'),
              sellingPrice: numeric(values, 'sellingPrice'),
              taxCategory: value(values, 'taxCategory'),
              locationAvailability: value(values, 'locationAvailability'),
              imagePlaceholder: value(values, 'imagePlaceholder'),
              recipeId: value(values, 'recipeId'),
              modifierGroupIds: arrayValue(values, 'modifierGroupIds'),
            });
            break;
          case 'modifiers':
            await repositories.modifiers.update(projectId, id, {
              ...common,
              selectionType:
                value(values, 'selectionType') === 'multiple' ? 'multiple' : 'single',
              required: value(values, 'required') === 'true',
              minimumSelections: numeric(values, 'minimumSelections'),
              maximumSelections: numeric(values, 'maximumSelections'),
              options: value(values, 'options'),
            });
            break;
          case 'recipes':
            await repositories.recipes.update(projectId, id, {
              ...common,
              menuItemId: value(values, 'menuItemId'),
              outputQuantity: numeric(values, 'outputQuantity'),
              outputUnitId: value(values, 'outputUnitId'),
              preparationInstructions: value(values, 'preparationInstructions'),
              ingredientId: value(values, 'ingredientId'),
              ingredientQuantity: numeric(values, 'ingredientQuantity'),
              ingredientUnitId: value(values, 'ingredientUnitId'),
              wastePercentage: numeric(values, 'wastePercentage'),
            });
            break;
          case 'ingredients':
            await repositories.ingredients.update(projectId, id, {
              ...common,
              sku: value(values, 'sku'),
              category: value(values, 'category'),
              baseUnitId: value(values, 'baseUnitId'),
              purchaseUnitId: value(values, 'purchaseUnitId'),
              conversionRate: numeric(values, 'conversionRate'),
              minimumStock: numeric(values, 'minimumStock'),
              cost: numeric(values, 'cost'),
              supplierReferences: value(values, 'supplierReferences'),
            });
            break;
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
            await repositories.employees.update(projectId, id, {
              ...common,
              fullName: value(values, 'fullName'),
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
    if (Array.isArray(current)) values[key] = current.join(',');
    else if (typeof current === 'boolean') values[key] = String(current);
    else if (typeof current === 'number') values[key] = String(current);
    else if (typeof current === 'string') values[key] = current;
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
