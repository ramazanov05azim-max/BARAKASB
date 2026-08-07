import type { CoffeeOperationalReadRepository } from '../repository-contracts';

export type RecipeInstructionResult =
  | { readonly status: 'AVAILABLE'; readonly instruction: string }
  | { readonly status: 'EMPTY'; readonly instruction: '' }
  | { readonly status: 'UNAVAILABLE'; readonly instruction: '' };

export interface RecipeInstructionQueryService {
  getProductInstruction(input: {
    readonly projectId: string;
    readonly productId: string;
  }): Promise<RecipeInstructionResult>;
}

export function createRecipeInstructionQueryService(
  operational: CoffeeOperationalReadRepository,
): RecipeInstructionQueryService {
  return {
    async getProductInstruction({ projectId, productId }) {
      const snapshot = await operational.load(projectId);
      const product = snapshot.menuItems.find((item) => item.id === productId);
      const recipe = product?.recipeId
        ? snapshot.recipes.find(
            (item) => item.id === product.recipeId && item.status === 'active',
          )
        : null;
      if (!recipe) return { status: 'UNAVAILABLE', instruction: '' };
      const instruction = recipe.preparationInstructions.trim();
      return instruction
        ? { status: 'AVAILABLE', instruction }
        : { status: 'EMPTY', instruction: '' };
    },
  };
}
