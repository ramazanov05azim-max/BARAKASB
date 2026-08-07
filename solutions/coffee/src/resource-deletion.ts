import type { CoffeeSnapshot, CollectionKey } from './domain';

export interface ResourceDependency {
  label:
    | 'locations'
    | 'registers'
    | 'workstations'
    | 'categories'
    | 'menuItems'
    | 'modifiers'
    | 'recipes'
    | 'ingredients'
    | 'units'
    | 'warehouses'
    | 'suppliers'
    | 'employees'
    | 'workspaces'
    | 'tables'
    | 'stockBalances'
    | 'defaultLocation'
    | 'businessProfile';
  names: string[];
}

const workspaceNames = {
  bar: 'Бар',
  kitchen: 'Кухня',
  warehouse: 'Склад',
  purchasing: 'Закупщик',
  manager: 'Руководитель',
  delivery: 'Доставка',
  production: 'Производство',
  pickup: 'Самовывоз',
} as const;

function containsReference(value: string, id: string): boolean {
  return value
    .split(',')
    .map((part) => part.trim())
    .includes(id);
}

function collect(
  dependencies: ResourceDependency[],
  label: ResourceDependency['label'],
  names: ReadonlyArray<string>,
): void {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length) dependencies.push({ label, names: unique });
}

export function resourceDeletionDependencies(
  snapshot: CoffeeSnapshot,
  kind: CollectionKey,
  id: string,
): ResourceDependency[] {
  const dependencies: ResourceDependency[] = [];
  switch (kind) {
    case 'locations':
      if (snapshot.project.defaultLocationId === id) {
        collect(dependencies, 'defaultLocation', ['Основная локация проекта']);
      }
      collect(
        dependencies,
        'registers',
        snapshot.registers
          .filter((item) => item.locationId === id)
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'workstations',
        snapshot.workstations
          .filter((item) => item.locationId === id)
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'categories',
        snapshot.menuCategories
          .filter((item) => containsReference(item.locationAvailability, id))
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'menuItems',
        snapshot.menuItems
          .filter((item) => containsReference(item.locationAvailability, id))
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'warehouses',
        snapshot.warehouses
          .filter((item) => item.locationId === id)
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'employees',
        snapshot.employees
          .filter((item) => item.assignedLocationIds.includes(id))
          .map((item) => item.fullName),
      );
      collect(
        dependencies,
        'tables',
        snapshot.tables
          .filter((item) => item.locationId === id)
          .map((item) => item.name),
      );
      break;
    case 'registers':
      collect(
        dependencies,
        'workstations',
        snapshot.workstations
          .filter((item) => item.registerId === id)
          .map((item) => item.name),
      );
      break;
    case 'workstations':
      break;
    case 'menuCategories':
      collect(
        dependencies,
        'menuItems',
        snapshot.menuItems
          .filter((item) => item.categoryId === id)
          .map((item) => item.name),
      );
      break;
    case 'menuItems':
      collect(
        dependencies,
        'recipes',
        snapshot.recipes
          .filter(
            (recipe) => recipe.target.type === 'menu-item' && recipe.target.id === id,
          )
          .map((recipe) => recipe.name),
      );
      break;
    case 'modifiers':
      collect(
        dependencies,
        'menuItems',
        snapshot.menuItems
          .filter((item) => item.modifierGroupIds.includes(id))
          .map((item) => item.name),
      );
      break;
    case 'recipes': {
      collect(
        dependencies,
        'menuItems',
        snapshot.menuItems
          .filter((item) => item.recipeId === id)
          .map((item) => item.name),
      );
      const targetId = snapshot.recipes.find((recipe) => recipe.id === id)?.target.id;
      if (targetId) {
        collect(
          dependencies,
          'recipes',
          snapshot.recipes
            .filter((recipe) =>
              recipe.components.some(
                (component) =>
                  component.type !== 'ingredient' && component.referenceId === targetId,
              ),
            )
            .map((recipe) => recipe.name),
        );
      }
      break;
    }
    case 'ingredients':
      collect(
        dependencies,
        'recipes',
        snapshot.recipes
          .filter((recipe) =>
            recipe.components.some(
              (component) =>
                component.type === 'ingredient' && component.referenceId === id,
            ),
          )
          .map((recipe) => recipe.name),
      );
      collect(
        dependencies,
        'stockBalances',
        snapshot.openingStockBalances
          .filter((balance) => balance.ingredientId === id)
          .map(
            (balance) =>
              snapshot.warehouses.find(
                (warehouse) => warehouse.id === balance.warehouseId,
              )?.name ?? '',
          ),
      );
      break;
    case 'units':
      collect(
        dependencies,
        'ingredients',
        snapshot.ingredients
          .filter((item) => item.baseUnitId === id || item.purchaseUnitId === id)
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'recipes',
        snapshot.recipes
          .filter(
            (recipe) =>
              recipe.outputUnitId === id ||
              recipe.components.some((component) => component.unitId === id),
          )
          .map((recipe) => recipe.name),
      );
      collect(
        dependencies,
        'stockBalances',
        snapshot.openingStockBalances
          .filter((balance) => balance.unitId === id)
          .map(
            (balance) =>
              snapshot.ingredients.find(
                (ingredient) => ingredient.id === balance.ingredientId,
              )?.name ?? '',
          ),
      );
      break;
    case 'warehouses':
      if (snapshot.businessProfile.defaultWarehouseId === id) {
        collect(dependencies, 'businessProfile', ['Склад по умолчанию']);
      }
      collect(
        dependencies,
        'ingredients',
        snapshot.ingredients
          .filter((item) => item.storageLocationId === id)
          .map((item) => item.name),
      );
      collect(
        dependencies,
        'stockBalances',
        snapshot.openingStockBalances
          .filter((balance) => balance.warehouseId === id)
          .map(
            (balance) =>
              snapshot.ingredients.find(
                (ingredient) => ingredient.id === balance.ingredientId,
              )?.name ?? '',
          ),
      );
      break;
    case 'suppliers':
      collect(
        dependencies,
        'ingredients',
        snapshot.ingredients
          .filter(
            (item) =>
              item.preferredSupplierId === id ||
              containsReference(item.supplierReferences, id),
          )
          .map((item) => item.name),
      );
      break;
    case 'employees':
      collect(
        dependencies,
        'warehouses',
        snapshot.warehouses
          .filter((warehouse) => warehouse.responsibleEmployeeId === id)
          .map((warehouse) => warehouse.name),
      );
      collect(
        dependencies,
        'workspaces',
        snapshot.solutionStructure.workspaces
          .filter((workspace) => workspace.assignedEmployeeIds.includes(id))
          .map((workspace) => workspaceNames[workspace.moduleId]),
      );
      break;
  }
  return dependencies;
}
