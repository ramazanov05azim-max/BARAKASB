export const recipeEngineTargetTypes = [
  'product',
  'preparation',
  'semi-finished',
  'package',
] as const;

export const recipeEngineComponentTypes = [
  'ingredient',
  'preparation',
  'semi-finished',
  'package',
] as const;

export type RecipeEngineTargetType = (typeof recipeEngineTargetTypes)[number];
export type RecipeEngineComponentType = (typeof recipeEngineComponentTypes)[number];

export interface RecipeEngineTargetReference {
  readonly type: RecipeEngineTargetType;
  readonly targetId: string;
}

export interface RecipeEngineQuantity {
  readonly value: number;
  readonly unitId: string;
}

export interface RecipeEngineComponent {
  readonly componentId: string;
  readonly type: RecipeEngineComponentType;
  readonly referenceId: string;
  readonly grossQuantity: RecipeEngineQuantity;
  readonly lossPercentage: number;
}

export interface RecipeEngineDefinition {
  readonly recipeId: string;
  readonly projectId: string;
  readonly solutionInstallationId: string;
  readonly target: RecipeEngineTargetReference;
  readonly output: RecipeEngineQuantity;
  readonly components: readonly RecipeEngineComponent[];
  readonly instructions: string;
  readonly version: number;
  readonly status: 'draft' | 'active' | 'inactive';
  readonly effectiveFrom: string | null;
}

export interface RecipeEngineValidationIssue {
  readonly code: string;
  readonly componentId?: string;
}

export interface RecipeEngineValidationResult {
  readonly valid: boolean;
  readonly issues: readonly RecipeEngineValidationIssue[];
}

export interface RecipeEngineRepository {
  getById(projectId: string, recipeId: string): Promise<RecipeEngineDefinition | null>;
  getEffectiveByTarget(
    projectId: string,
    target: RecipeEngineTargetReference,
    effectiveAt: string,
  ): Promise<RecipeEngineDefinition | null>;
  listVersions(
    projectId: string,
    target: RecipeEngineTargetReference,
  ): Promise<readonly RecipeEngineDefinition[]>;
  save(
    projectId: string,
    definition: RecipeEngineDefinition,
  ): Promise<RecipeEngineDefinition>;
}

export interface RecipeEngine {
  validate(definition: RecipeEngineDefinition): RecipeEngineValidationResult;
  resolveEffective(input: {
    readonly projectId: string;
    readonly target: RecipeEngineTargetReference;
    readonly effectiveAt: string;
  }): Promise<RecipeEngineDefinition | null>;
}
