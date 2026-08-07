'use client';

import type { PreparationService } from '../../order-preparation/contracts';
import { localCoffeePreparationService } from '../../order-preparation/service';
import {
  createRecipeInstructionQueryService,
  type RecipeInstructionQueryService,
} from '../../recipe-engine/queries';
import { localCoffeeOperationalReadRepository } from '../../repositories';
import type { KitchenRuntimeContext, KitchenState } from './domain';

export interface CoffeeKitchenService {
  load(context: KitchenRuntimeContext): Promise<KitchenState>;
  acceptPosition(
    context: KitchenRuntimeContext,
    orderId: string,
    orderItemId: string,
  ): Promise<void>;
  markPositionReady(
    context: KitchenRuntimeContext,
    orderId: string,
    orderItemId: string,
  ): Promise<void>;
  acceptAll(context: KitchenRuntimeContext, orderId: string): Promise<void>;
  confirmAllReady(context: KitchenRuntimeContext, orderId: string): Promise<void>;
  subscribe(context: KitchenRuntimeContext, listener: () => void): () => void;
}

export function createCoffeeKitchenService(input: {
  readonly preparation: PreparationService;
  readonly recipes: RecipeInstructionQueryService;
}): CoffeeKitchenService {
  return {
    async load(context) {
      const queue = await input.preparation.loadKitchenQueue(context);
      return {
        ...queue,
        tickets: await Promise.all(
          queue.tickets.map(async (ticket) => ({
            ...ticket,
            positions: await Promise.all(
              ticket.positions.map(async (position) => {
                let recipe: Awaited<
                  ReturnType<RecipeInstructionQueryService['getProductInstruction']>
                > = { status: 'UNAVAILABLE', instruction: '' };
                try {
                  recipe = await input.recipes.getProductInstruction({
                    projectId: context.projectId,
                    productId: position.productId,
                  });
                } catch {
                  // A missing owner read source is represented as an unavailable recipe.
                }
                return {
                  ...position,
                  instructionStatus: recipe.status,
                  instruction: recipe.instruction,
                };
              }),
            ),
          })),
        ),
      };
    },
    acceptPosition: (context, orderId, itemId) =>
      input.preparation.acceptPosition(context, orderId, itemId),
    markPositionReady: (context, orderId, itemId) =>
      input.preparation.markPositionReady(context, orderId, itemId),
    acceptAll: (context, orderId) => input.preparation.acceptAll(context, orderId),
    confirmAllReady: (context, orderId) =>
      input.preparation.confirmAllReady(context, orderId),
    subscribe: (context, listener) => input.preparation.subscribe(context, listener),
  };
}

export const localCoffeeKitchenService = createCoffeeKitchenService({
  preparation: localCoffeePreparationService,
  recipes: createRecipeInstructionQueryService(localCoffeeOperationalReadRepository),
});
