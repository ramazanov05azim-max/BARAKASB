import type { MediaAssetId } from '@barakasb/contracts-platform';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItem } from './domain';
import type { CoffeeManagerRepositories } from './repository-contracts';
import { removeCoffeeMediaIfUnreferenced } from './workspace-store';

const sharedAssetId = 'media-shared' as MediaAssetId;

function item(id: string, imageAssetId: MediaAssetId | null): MenuItem {
  return {
    id,
    name: id,
    categoryId: 'category-1',
    description: '',
    sku: id,
    barcode: '',
    sellingPrice: 1,
    taxCategory: 'standard',
    locationAvailability: 'location-1',
    imageAssetId,
    recipeId: '',
    modifierGroupIds: [],
    status: 'active',
    updatedAt: '2026-08-04T00:00:00.000Z',
  };
}

describe('Coffee media reference lifecycle', () => {
  it('does not delete a shared asset while another menu item references it', async () => {
    const remove = vi.fn();
    const repositories = {
      menuItems: {
        list: vi.fn(async () => [
          item('item-1', sharedAssetId),
          item('item-2', sharedAssetId),
        ]),
      },
      menuCategories: { list: vi.fn(async () => []) },
      mediaAssets: { remove },
    } as unknown as CoffeeManagerRepositories;

    await expect(
      removeCoffeeMediaIfUnreferenced(repositories, 'project-a', sharedAssetId),
    ).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it('deletes the media asset once no menu item references it', async () => {
    const remove = vi.fn();
    const repositories = {
      menuItems: { list: vi.fn(async () => [item('item-1', null)]) },
      menuCategories: { list: vi.fn(async () => []) },
      mediaAssets: { remove },
    } as unknown as CoffeeManagerRepositories;

    await expect(
      removeCoffeeMediaIfUnreferenced(repositories, 'project-a', sharedAssetId),
    ).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith('project-a', sharedAssetId);
  });
});
