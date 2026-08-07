import { describe, expect, it, vi } from 'vitest';
import type {
  PreparationQueueReadModel,
  PreparationService,
} from '../../order-preparation/contracts';
import type { RecipeInstructionQueryService } from '../../recipe-engine/queries';
import { createCoffeeKitchenService } from './service';

const context = {
  projectId: 'project-1',
  businessEnvironmentId: 'environment-1',
  workspaceId: 'workspace-kitchen',
  employeeId: 'employee-kitchen',
};

function preparation(): PreparationService {
  return {
    loadKitchenQueue: vi.fn(async (): Promise<PreparationQueueReadModel> => ({
      locationName: 'Производственная зона',
      sourceWarehouseName: 'Кухонный запас',
      sourceWarehouseConfigured: true,
      timing: { delayedMinutes: 10, criticalMinutes: 20 },
      tickets: [
        {
          orderId: 'order-1',
          orderNumber: 'Б-0001',
          destination: 'Стол 5',
          sentByEmployeeName: 'Анна',
          sentAt: '2026-08-07T10:00:00.000Z',
          orderActive: true,
          completionConfirmed: false,
          positions: [
            {
              orderItemId: 'item-1',
              productId: 'product-1',
              productName: 'Паста',
              quantity: 1,
              modifiers: [],
              comment: '',
              status: 'NEW' as const,
              sentAt: '2026-08-07T10:00:00.000Z',
              preparationStartedAt: null,
              readyAt: null,
              responsibleEmployeeNames: [],
            },
          ],
        },
      ],
    })),
    subscribe: vi.fn(() => () => undefined),
    acceptPosition: vi.fn(async () => undefined),
    markPositionReady: vi.fn(async () => undefined),
    acceptAll: vi.fn(async () => undefined),
    confirmAllReady: vi.fn(async () => undefined),
  };
}

describe('Coffee Kitchen service', () => {
  it('reads instructions only through the public Recipe query contract', async () => {
    const recipes: RecipeInstructionQueryService = {
      getProductInstruction: vi.fn(
        async () =>
          ({
            status: 'AVAILABLE',
            instruction: 'Запекать 8 минут.',
          }) as const,
      ),
    };
    const service = createCoffeeKitchenService({ preparation: preparation(), recipes });
    const state = await service.load(context);
    expect(recipes.getProductInstruction).toHaveBeenCalledWith({
      projectId: context.projectId,
      productId: 'product-1',
    });
    expect(state.tickets[0]?.positions[0]).toMatchObject({
      instructionStatus: 'AVAILABLE',
      instruction: 'Запекать 8 минут.',
    });
  });

  it('degrades a failed Recipe read to an explicit unavailable state', async () => {
    const service = createCoffeeKitchenService({
      preparation: preparation(),
      recipes: {
        getProductInstruction: vi.fn(async () => {
          throw new Error('offline');
        }),
      },
    });
    await expect(service.load(context)).resolves.toMatchObject({
      tickets: [
        {
          positions: [{ instructionStatus: 'UNAVAILABLE', instruction: '' }],
        },
      ],
    });
  });
});
