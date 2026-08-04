import type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createIndexedDbMediaAssetRepository } from './indexeddb-repository';
import { createMediaAssetService } from './media-service';

const environment = {
  async decode() {
    return { source: {}, width: 2000, height: 1000, release() {} };
  },
  async encode(_source: unknown, _width: number, _height: number, mimeType: string) {
    return new Blob(['normalized'], { type: mimeType });
  },
};

describe('media asset service', () => {
  it('creates a reusable typed media asset from a normalized image', async () => {
    const service = createMediaAssetService(
      createIndexedDbMediaAssetRepository({ indexedDb: new IDBFactory() }),
      environment,
    );
    const asset = await service.uploadImage({
      projectId: 'project-a',
      ownerType: 'catalog-item',
      ownerId: null,
      fileName: 'coffee.png',
      file: new Blob(['source'], { type: 'image/png' }),
    });

    expect(asset).toMatchObject<Partial<MediaAsset>>({
      projectId: 'project-a',
      source: 'local-binary',
      mimeType: 'image/webp',
      width: 1600,
      height: 800,
    });
    expect(await service.get('project-a', asset.id)).not.toBeNull();
    expect(await service.get('project-b', asset.id)).toBeNull();
  });

  it('uses a supplied deterministic asset ID for idempotent migration', async () => {
    const service = createMediaAssetService(
      createIndexedDbMediaAssetRepository({ indexedDb: new IDBFactory() }),
      environment,
    );
    const deterministicId = 'media-legacy-test' as MediaAssetId;
    const input = {
      projectId: 'project-a',
      ownerType: 'catalog-item',
      ownerId: 'item-1',
      fileName: 'legacy.png',
      file: new Blob(['source'], { type: 'image/png' }),
      assetId: deterministicId,
    };
    await service.uploadImage(input);
    await service.uploadImage(input);

    expect(await service.list('project-a')).toHaveLength(1);
    expect((await service.list('project-a'))[0]?.id).toBe(deterministicId);
  });
});
