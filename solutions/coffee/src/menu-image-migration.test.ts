import type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';
import type { MediaAssetService } from '@barakasb/frontend-media';
import { describe, expect, it, vi } from 'vitest';
import type { CoffeeSnapshot, MenuItem } from './domain';
import {
  legacyMediaAssetId,
  migrateLegacyMenuImages,
  readLegacyMenuImage,
} from './menu-image-migration';

const legacyDataUrl = 'data:image/png;base64,bGVnYWN5LWltYWdl';

function menuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    name: 'Капучино',
    categoryId: 'category-1',
    description: '',
    sku: 'MENU-0001',
    barcode: '',
    sellingPrice: 350,
    taxCategory: 'standard',
    locationAvailability: 'location-1',
    imageAssetId: null,
    recipeId: '',
    modifierGroupIds: [],
    status: 'active',
    updatedAt: '2026-08-04T00:00:00.000Z',
    ...overrides,
  };
}

function snapshotWithLegacy(value: string): CoffeeSnapshot {
  const item = {
    ...menuItem(),
    imagePlaceholder: value,
  };
  return { menuItems: [item] } as unknown as CoffeeSnapshot;
}

function mediaFixture({ fail = false }: { fail?: boolean } = {}) {
  const assets = new Map<MediaAssetId, MediaAsset>();
  const uploadImage = vi.fn(async (input) => {
    if (fail) throw new Error('media-write-failed');
    const timestamp = '2026-08-04T00:00:00.000Z';
    const asset: MediaAsset = {
      id: input.assetId ?? ('media-generated' as MediaAssetId),
      projectId: input.projectId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: input.fileName,
      mimeType: 'image/webp',
      byteSize: input.file.size,
      width: 800,
      height: 600,
      source: 'local-binary',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    assets.set(asset.id, asset);
    return asset;
  });
  const importExternalImage = vi.fn(async (input) => {
    if (fail) throw new Error('media-write-failed');
    const timestamp = '2026-08-04T00:00:00.000Z';
    const asset: MediaAsset = {
      id: input.assetId ?? ('media-generated' as MediaAssetId),
      projectId: input.projectId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: 'legacy-external-image',
      mimeType: 'image/jpeg',
      byteSize: 0,
      width: 0,
      height: 0,
      source: 'legacy-external',
      externalUrl: input.externalUrl,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    assets.set(asset.id, asset);
    return asset;
  });
  const service: MediaAssetService = {
    uploadImage,
    importExternalImage,
    async get(projectId, assetId) {
      const asset = assets.get(assetId);
      return asset?.projectId === projectId ? asset : null;
    },
    async list(projectId) {
      return [...assets.values()].filter((asset) => asset.projectId === projectId);
    },
    async resolveDisplayUrl() {
      return null;
    },
    async remove(_projectId, assetId) {
      assets.delete(assetId);
    },
    async removeProject(projectId) {
      for (const asset of assets.values()) {
        if (asset.projectId === projectId) assets.delete(asset.id);
      }
    },
  };
  return { assets, service, uploadImage, importExternalImage };
}

describe('legacy Coffee menu image migration', () => {
  it('migrates the audited Base64 data URL to a deterministic media reference', async () => {
    const media = mediaFixture();
    const persist = vi.fn();
    const result = await migrateLegacyMenuImages({
      projectId: 'project-a',
      snapshot: snapshotWithLegacy(legacyDataUrl),
      mediaAssets: media.service,
      persist,
    });

    const expectedId = await legacyMediaAssetId('project-a', 'item-1', legacyDataUrl);
    expect(result.migratedCount).toBe(1);
    expect(result.snapshot.menuItems[0]?.imageAssetId).toBe(expectedId);
    expect(readLegacyMenuImage(result.snapshot.menuItems[0]!)).toBeNull();
    expect(media.assets.has(expectedId)).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('is idempotent after the entity stores the media reference', async () => {
    const media = mediaFixture();
    const first = await migrateLegacyMenuImages({
      projectId: 'project-a',
      snapshot: snapshotWithLegacy(legacyDataUrl),
      mediaAssets: media.service,
      persist() {},
    });
    const secondPersist = vi.fn();
    const second = await migrateLegacyMenuImages({
      projectId: 'project-a',
      snapshot: first.snapshot,
      mediaAssets: media.service,
      persist: secondPersist,
    });

    expect(second.migratedCount).toBe(0);
    expect(media.uploadImage).toHaveBeenCalledOnce();
    expect(secondPersist).not.toHaveBeenCalled();
  });

  it('preserves the original payload and preview when media persistence fails', async () => {
    const media = mediaFixture({ fail: true });
    const persist = vi.fn();
    const original = snapshotWithLegacy(legacyDataUrl);
    const result = await migrateLegacyMenuImages({
      projectId: 'project-a',
      snapshot: original,
      mediaAssets: media.service,
      persist,
    });

    expect(result.failedCount).toBe(1);
    expect(result.snapshot.menuItems[0]?.imageAssetId).toBeNull();
    expect(readLegacyMenuImage(result.snapshot.menuItems[0]!)).toBe(legacyDataUrl);
    expect(persist).not.toHaveBeenCalled();
  });

  it('preserves external HTTP images as isolated media metadata without downloading', async () => {
    const media = mediaFixture();
    const externalUrl = 'https://images.example.test/menu/cappuccino.jpg';
    const result = await migrateLegacyMenuImages({
      projectId: 'project-a',
      snapshot: snapshotWithLegacy(externalUrl),
      mediaAssets: media.service,
      persist() {},
    });

    expect(result.migratedCount).toBe(1);
    expect(media.importExternalImage).toHaveBeenCalledWith(
      expect.objectContaining({ externalUrl, projectId: 'project-a' }),
    );
    expect(media.uploadImage).not.toHaveBeenCalled();
  });
});
