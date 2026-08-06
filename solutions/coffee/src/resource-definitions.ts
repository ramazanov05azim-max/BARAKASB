import type {
  CoffeeCapability,
  CoffeeSnapshot,
  CollectionKey,
  FormValues,
} from './domain';
import type { CoffeeTranslationKey } from './i18n';

export interface FieldOption {
  value: string;
  label?: string;
  labelKey?: CoffeeTranslationKey;
}

export interface FieldDefinition {
  name: string;
  labelKey: CoffeeTranslationKey;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'image'
    | 'multi-select'
    | 'recipe-target'
    | 'recipe-components';
  required?: boolean;
  min?: number;
  options?: FieldOption[];
  optionsFrom?: (snapshot: CoffeeSnapshot) => FieldOption[];
  visibleWhen?: (snapshot: CoffeeSnapshot) => boolean;
  defaultValue?: string;
  helperKey?: CoffeeTranslationKey;
}

export interface ResourceDefinition {
  kind: CollectionKey;
  titleKey: CoffeeTranslationKey;
  descriptionKey: CoffeeTranslationKey;
  addKey: CoffeeTranslationKey;
  readCapability: CoffeeCapability;
  manageCapability: CoffeeCapability;
  fields: FieldDefinition[];
  summaryFields: string[];
  duplicate?: boolean;
}

const statusField: FieldDefinition = {
  name: 'status',
  labelKey: 'common.status',
  type: 'select',
  required: true,
  defaultValue: 'active',
  options: [
    { value: 'active', labelKey: 'options.active' },
    { value: 'inactive', labelKey: 'options.inactive' },
    { value: 'draft', labelKey: 'options.draft' },
  ],
};

const locationOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.locations.map((location) => ({ value: location.id, label: location.name }));

const registerOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.registers.map((register) => ({ value: register.id, label: register.name }));

const categoryOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.menuCategories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

const recipeOptions = (snapshot: CoffeeSnapshot): FieldOption[] => [
  { value: '', labelKey: 'common.none' },
  ...snapshot.recipes
    .filter((recipe) => {
      const legacy = recipe as unknown as { menuItemId?: unknown };
      return (
        recipe.target?.type === 'menu-item' || typeof legacy.menuItemId === 'string'
      );
    })
    .map((recipe) => ({ value: recipe.id, label: recipe.name })),
];

const modifierGroupOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.modifiers.map((group) => ({
    value: group.id,
    label: group.name,
  }));

const unitOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.units.map((unit) => ({
    value: unit.id,
    label: `${unit.name} (${unit.symbol})`,
  }));

const employeeOptions = (snapshot: CoffeeSnapshot): FieldOption[] => [
  { value: '', labelKey: 'common.none' },
  ...snapshot.employees.map((employee) => ({
    value: employee.id,
    label: employee.fullName,
  })),
];

const roleOptions = (snapshot: CoffeeSnapshot): FieldOption[] =>
  snapshot.roles.map((role) => ({
    value: role.id,
    labelKey: role.nameKey as CoffeeTranslationKey,
  }));

export const resourceDefinitions: Record<CollectionKey, ResourceDefinition> = {
  locations: {
    kind: 'locations',
    titleKey: 'locations.title',
    descriptionKey: 'locations.description',
    addKey: 'locations.add',
    readCapability: 'locations.read',
    manageCapability: 'locations.manage',
    summaryFields: ['code', 'address', 'timezone'],
    fields: [
      {
        name: 'name',
        labelKey: 'fields.name',
        type: 'text',
        required: true,
      },
      {
        name: 'code',
        labelKey: 'fields.code',
        type: 'text',
        required: true,
      },
      {
        name: 'locationType',
        labelKey: 'fields.locationType',
        type: 'select',
        required: true,
        defaultValue: 'cafe',
        options: [
          { value: 'cafe', labelKey: 'options.locationCafe' },
          { value: 'kiosk', labelKey: 'options.locationKiosk' },
          { value: 'production', labelKey: 'options.locationProduction' },
        ],
      },
      {
        name: 'address',
        labelKey: 'fields.address',
        type: 'textarea',
        required: true,
      },
      {
        name: 'timezone',
        labelKey: 'fields.timezone',
        type: 'text',
        required: true,
        defaultValue: 'Europe/Moscow',
      },
      {
        name: 'currency',
        labelKey: 'fields.currency',
        type: 'text',
        required: true,
        defaultValue: 'RUB',
      },
      { name: 'phone', labelKey: 'fields.phone', type: 'tel', required: true },
      { name: 'email', labelKey: 'fields.email', type: 'email', required: true },
      {
        name: 'openingHours',
        labelKey: 'fields.openingHours',
        type: 'text',
        required: true,
        defaultValue: '08:00–22:00',
      },
      statusField,
    ],
  },
  registers: {
    kind: 'registers',
    titleKey: 'registers.title',
    descriptionKey: 'registers.description',
    addKey: 'registers.add',
    readCapability: 'workstations.read',
    manageCapability: 'workstations.manage',
    summaryFields: ['code', 'locationId', 'paymentMethods'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      { name: 'code', labelKey: 'fields.code', type: 'text', required: true },
      {
        name: 'locationId',
        labelKey: 'fields.location',
        type: 'select',
        required: true,
        optionsFrom: locationOptions,
      },
      {
        name: 'receiptPrinter',
        labelKey: 'fields.receiptPrinter',
        type: 'text',
      },
      { name: 'cashDrawer', labelKey: 'fields.cashDrawer', type: 'text' },
      {
        name: 'paymentMethods',
        labelKey: 'fields.paymentMethods',
        type: 'text',
        required: true,
        defaultValue: 'Cash, Card',
      },
      statusField,
    ],
  },
  workstations: {
    kind: 'workstations',
    titleKey: 'workstations.title',
    descriptionKey: 'workstations.description',
    addKey: 'workstations.add',
    readCapability: 'workstations.read',
    manageCapability: 'workstations.manage',
    summaryFields: ['workstationType', 'locationId', 'enabledModules'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      {
        name: 'workstationType',
        labelKey: 'fields.workstationType',
        type: 'select',
        required: true,
        defaultValue: 'pos',
        options: [
          { value: 'pos', labelKey: 'options.pos' },
          { value: 'barista', labelKey: 'options.barista' },
          { value: 'kitchen', labelKey: 'options.kitchen' },
          { value: 'inventory', labelKey: 'options.inventory' },
          { value: 'manager', labelKey: 'options.manager' },
        ],
      },
      {
        name: 'locationId',
        labelKey: 'fields.location',
        type: 'select',
        required: true,
        optionsFrom: locationOptions,
      },
      {
        name: 'registerId',
        labelKey: 'fields.register',
        type: 'select',
        optionsFrom: registerOptions,
      },
      { name: 'printer', labelKey: 'fields.printer', type: 'text' },
      {
        name: 'enabledModules',
        labelKey: 'fields.enabledModules',
        type: 'text',
        required: true,
        defaultValue: 'Menu',
      },
      statusField,
    ],
  },
  menuCategories: {
    kind: 'menuCategories',
    titleKey: 'categories.title',
    descriptionKey: 'categories.description',
    addKey: 'categories.add',
    readCapability: 'menu.read',
    manageCapability: 'menu.manage',
    summaryFields: ['displayOrder'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      {
        name: 'displayOrder',
        labelKey: 'fields.displayOrder',
        type: 'number',
        required: true,
        min: 0,
        defaultValue: '1',
      },
      {
        name: 'locationAvailability',
        labelKey: 'fields.locationAvailability',
        type: 'multi-select',
        required: true,
        optionsFrom: locationOptions,
        visibleWhen: (snapshot) => snapshot.locations.length > 1,
      },
      {
        ...statusField,
        options: [
          { value: 'active', labelKey: 'options.categoryActive' },
          { value: 'inactive', labelKey: 'options.categoryInactive' },
        ],
      },
    ],
  },
  menuItems: {
    kind: 'menuItems',
    titleKey: 'items.title',
    descriptionKey: 'items.description',
    addKey: 'items.add',
    readCapability: 'menu.read',
    manageCapability: 'menu.manage',
    summaryFields: ['sellingPrice'],
    duplicate: true,
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      {
        name: 'categoryId',
        labelKey: 'fields.category',
        type: 'select',
        required: true,
        optionsFrom: categoryOptions,
      },
      {
        name: 'sellingPrice',
        labelKey: 'fields.sellingPrice',
        type: 'number',
        required: true,
        min: 0,
      },
      {
        name: 'imageAssetId',
        labelKey: 'fields.image',
        type: 'image',
      },
      {
        name: 'recipeId',
        labelKey: 'fields.recipe',
        type: 'select',
        optionsFrom: recipeOptions,
      },
      {
        name: 'modifierGroupIds',
        labelKey: 'fields.modifierGroups',
        type: 'multi-select',
        optionsFrom: modifierGroupOptions,
      },
      {
        name: 'barcode',
        labelKey: 'fields.barcode',
        type: 'text',
        helperKey: 'fields.barcodeHelp',
      },
      {
        ...statusField,
        options: [
          { value: 'active', labelKey: 'options.active' },
          { value: 'inactive', labelKey: 'options.inactive' },
        ],
      },
    ],
  },
  modifiers: {
    kind: 'modifiers',
    titleKey: 'modifiers.title',
    descriptionKey: 'modifiers.description',
    addKey: 'modifiers.add',
    readCapability: 'menu.read',
    manageCapability: 'menu.manage',
    summaryFields: ['selectionType', 'options'],
    duplicate: true,
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      {
        name: 'purpose',
        labelKey: 'fields.modifierPurpose',
        type: 'select',
        required: true,
        defaultValue: 'configuration',
        options: [
          { value: 'configuration', labelKey: 'options.modifierConfiguration' },
          { value: 'additional', labelKey: 'options.modifierAdditional' },
        ],
      },
      {
        name: 'selectionType',
        labelKey: 'fields.selectionType',
        type: 'select',
        required: true,
        defaultValue: 'single',
        options: [
          { value: 'single', labelKey: 'options.single' },
          { value: 'multiple', labelKey: 'options.multiple' },
        ],
      },
      {
        name: 'required',
        labelKey: 'fields.requiredStatus',
        type: 'select',
        required: true,
        defaultValue: 'false',
        options: [
          { value: 'true', labelKey: 'common.yes' },
          { value: 'false', labelKey: 'common.no' },
        ],
      },
      {
        name: 'minimumSelections',
        labelKey: 'fields.minimumSelections',
        type: 'number',
        required: true,
        min: 0,
        defaultValue: '0',
      },
      {
        name: 'maximumSelections',
        labelKey: 'fields.maximumSelections',
        type: 'number',
        required: true,
        min: 1,
        defaultValue: '1',
      },
      {
        name: 'options',
        labelKey: 'fields.options',
        type: 'textarea',
        required: true,
      },
      statusField,
    ],
  },
  recipes: {
    kind: 'recipes',
    titleKey: 'recipes.title',
    descriptionKey: 'recipes.description',
    addKey: 'recipes.add',
    readCapability: 'recipes.read',
    manageCapability: 'recipes.manage',
    summaryFields: ['outputQuantity', 'outputUnitId'],
    fields: [
      {
        name: 'target',
        labelKey: 'fields.recipeTarget',
        type: 'recipe-target',
        required: true,
        defaultValue: '{"type":"menu-item","id":"","name":""}',
      },
      {
        name: 'outputQuantity',
        labelKey: 'fields.outputQuantity',
        type: 'number',
        required: true,
        min: 0.0001,
        defaultValue: '1',
      },
      {
        name: 'outputUnitId',
        labelKey: 'fields.outputUnit',
        type: 'select',
        required: true,
        optionsFrom: unitOptions,
      },
      {
        name: 'preparationInstructions',
        labelKey: 'fields.preparationInstructions',
        type: 'textarea',
      },
      {
        name: 'components',
        labelKey: 'fields.recipeComponents',
        type: 'recipe-components',
        required: true,
        defaultValue: '[]',
      },
      {
        ...statusField,
        options: [
          { value: 'active', labelKey: 'options.recipeActive' },
          { value: 'inactive', labelKey: 'options.recipeInactive' },
        ],
      },
    ],
  },
  ingredients: {
    kind: 'ingredients',
    titleKey: 'ingredients.title',
    descriptionKey: 'ingredients.description',
    addKey: 'ingredients.add',
    readCapability: 'inventory.read',
    manageCapability: 'inventory.manage',
    summaryFields: ['category', 'accountingType', 'purchaseUnitId'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      { name: 'category', labelKey: 'fields.category', type: 'text', required: true },
      {
        name: 'accountingType',
        labelKey: 'fields.accountingType',
        type: 'select',
        required: true,
        options: [
          { value: 'weight', labelKey: 'options.accountingWeight' },
          { value: 'volume', labelKey: 'options.accountingVolume' },
          { value: 'pieces', labelKey: 'options.accountingPieces' },
        ],
      },
      {
        name: 'purchaseUnitId',
        labelKey: 'fields.purchaseUnit',
        type: 'select',
        required: true,
        optionsFrom: unitOptions,
      },
      {
        name: 'purchasePackageSize',
        labelKey: 'fields.purchasePackageSize',
        type: 'number',
        required: true,
        min: 0.0001,
        defaultValue: '1',
        helperKey: 'fields.purchasePackageSizeHelp',
      },
      {
        name: 'barcode',
        labelKey: 'fields.barcode',
        type: 'text',
        helperKey: 'fields.ingredientBarcodeHelp',
      },
      {
        ...statusField,
        options: [
          { value: 'active', labelKey: 'options.active' },
          { value: 'inactive', labelKey: 'options.inactive' },
        ],
      },
    ],
  },
  units: {
    kind: 'units',
    titleKey: 'units.title',
    descriptionKey: 'units.description',
    addKey: 'units.add',
    readCapability: 'inventory.read',
    manageCapability: 'inventory.manage',
    summaryFields: ['symbol', 'dimension', 'conversionRate'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      { name: 'symbol', labelKey: 'fields.symbol', type: 'text', required: true },
      {
        name: 'dimension',
        labelKey: 'fields.dimension',
        type: 'select',
        required: true,
        options: [
          { value: 'mass', labelKey: 'options.mass' },
          { value: 'volume', labelKey: 'options.volume' },
          { value: 'count', labelKey: 'options.count' },
        ],
      },
      {
        name: 'conversionTargetId',
        labelKey: 'fields.conversionTarget',
        type: 'select',
        optionsFrom: (snapshot) => [
          { value: '', labelKey: 'common.none' },
          ...unitOptions(snapshot),
        ],
      },
      {
        name: 'conversionRate',
        labelKey: 'fields.conversionRate',
        type: 'number',
        required: true,
        min: 0.0001,
        defaultValue: '1',
      },
      statusField,
    ],
  },
  warehouses: {
    kind: 'warehouses',
    titleKey: 'warehouses.title',
    descriptionKey: 'warehouses.description',
    addKey: 'warehouses.add',
    readCapability: 'inventory.read',
    manageCapability: 'inventory.manage',
    summaryFields: ['code', 'locationId', 'warehouseType'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      { name: 'code', labelKey: 'fields.code', type: 'text', required: true },
      {
        name: 'locationId',
        labelKey: 'fields.location',
        type: 'select',
        required: true,
        optionsFrom: locationOptions,
      },
      {
        name: 'warehouseType',
        labelKey: 'fields.warehouseType',
        type: 'select',
        required: true,
        defaultValue: 'storage',
        options: [
          { value: 'storage', labelKey: 'options.storage' },
          { value: 'bar', labelKey: 'options.bar' },
          { value: 'kitchen', labelKey: 'options.kitchenStorage' },
        ],
      },
      {
        name: 'addressOrZone',
        labelKey: 'fields.addressOrZone',
        type: 'text',
        required: true,
      },
      {
        name: 'responsibleEmployeeId',
        labelKey: 'fields.responsibleEmployee',
        type: 'select',
        optionsFrom: employeeOptions,
      },
      statusField,
    ],
  },
  suppliers: {
    kind: 'suppliers',
    titleKey: 'suppliers.title',
    descriptionKey: 'suppliers.description',
    addKey: 'suppliers.add',
    readCapability: 'suppliers.read',
    manageCapability: 'suppliers.manage',
    summaryFields: ['contactPerson', 'phone', 'deliverySchedule'],
    fields: [
      { name: 'name', labelKey: 'fields.name', type: 'text', required: true },
      {
        name: 'contactPerson',
        labelKey: 'fields.contactPerson',
        type: 'text',
        required: true,
      },
      { name: 'phone', labelKey: 'fields.phone', type: 'tel', required: true },
      { name: 'email', labelKey: 'fields.email', type: 'email', required: true },
      { name: 'address', labelKey: 'fields.address', type: 'textarea' },
      {
        name: 'taxIdentifier',
        labelKey: 'fields.taxIdentifier',
        type: 'text',
      },
      {
        name: 'paymentTerms',
        labelKey: 'fields.paymentTerms',
        type: 'text',
        required: true,
      },
      {
        name: 'deliverySchedule',
        labelKey: 'fields.deliverySchedule',
        type: 'text',
      },
      {
        name: 'suppliedIngredients',
        labelKey: 'fields.suppliedIngredients',
        type: 'textarea',
      },
      statusField,
    ],
  },
  employees: {
    kind: 'employees',
    titleKey: 'employees.title',
    descriptionKey: 'employees.description',
    addKey: 'employees.add',
    readCapability: 'employees.read',
    manageCapability: 'employees.manage',
    summaryFields: ['employeeCode', 'email', 'assignedRoleId'],
    fields: [
      {
        name: 'fullName',
        labelKey: 'fields.fullName',
        type: 'text',
        required: true,
      },
      { name: 'email', labelKey: 'fields.email', type: 'email', required: true },
      { name: 'phone', labelKey: 'fields.phone', type: 'tel', required: true },
      {
        name: 'employeeCode',
        labelKey: 'fields.employeeCode',
        type: 'text',
        required: true,
      },
      {
        name: 'assignedLocationIds',
        labelKey: 'fields.assignedLocations',
        type: 'select',
        required: true,
        optionsFrom: locationOptions,
      },
      {
        name: 'assignedRoleId',
        labelKey: 'fields.assignedRole',
        type: 'select',
        optionsFrom: (snapshot) => [
          { value: '', labelKey: 'common.none' },
          ...roleOptions(snapshot),
        ],
      },
      {
        name: 'employmentStatus',
        labelKey: 'fields.employmentStatus',
        type: 'select',
        required: true,
        defaultValue: 'invited',
        options: [
          { value: 'invited', labelKey: 'options.invited' },
          { value: 'active', labelKey: 'options.employed' },
          { value: 'inactive', labelKey: 'options.inactive' },
        ],
      },
      {
        name: 'hireDate',
        labelKey: 'fields.hireDate',
        type: 'date',
        required: true,
      },
      { name: 'notes', labelKey: 'fields.notes', type: 'textarea' },
      statusField,
    ],
  },
};

export function initialValues(definition: ResourceDefinition): FormValues {
  return Object.fromEntries(
    definition.fields.map((field) => [field.name, field.defaultValue ?? '']),
  );
}
