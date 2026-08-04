import type { MediaAssetId } from '@barakasb/contracts-platform';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import {
  createIndexedDbMediaAssetRepository,
  mediaBinaryStoreName,
  mediaDatabaseName,
  mediaMetadataStoreName,
} from './indexeddb-repository';

const assetId = 'media-test-1' as MediaAssetId;

function localInput(projectId = 'project-a') {
  return {
    id: assetId,
    projectId,
    ownerType: 'catalog-item',
    ownerId: 'item-1',
    fileName: 'coffee.webp',
    mimeType: 'image/webp',
    byteSize: 8,
    width: 800,
    height: 600,
    blob: new Blob(['image'], { type: 'image/webp' }),
  };
}

describe('IndexedDB media asset repository', () => {
  it('stores metadata and binary separately and survives repository recreation', async () => {
    const indexedDb = new IDBFactory();
    const first = createIndexedDbMediaAssetRepository({ indexedDb });
    await first.storeLocal(localInput());

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDb.open(mediaDatabaseName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(database.objectStoreNames.contains(mediaMetadataStoreName)).toBe(true);
    expect(database.objectStoreNames.contains(mediaBinaryStoreName)).toBe(true);
    database.close();

    const refreshed = createIndexedDbMediaAssetRepository({ indexedDb });
    await expect(refreshed.get('project-a', assetId)).resolves.toMatchObject({
      id: assetId,
      source: 'local-binary',
      projectId: 'project-a',
    });
    await expect(refreshed.get('project-b', assetId)).resolves.toBeNull();
  });

  it('resolves a display URL and revokes the temporary URL exactly once', async () => {
    const indexedDb = new IDBFactory();
    const createObjectURL = vi.fn(() => 'blob:media-preview');
    const revokeObjectURL = vi.fn();
    const repository = createIndexedDbMediaAssetRepository({
      indexedDb,
      objectUrl: { createObjectURL, revokeObjectURL },
    });
    await repository.storeLocal(localInput());

    const lease = await repository.resolveDisplayUrl('project-a', assetId);
    expect(lease?.url).toBe('blob:media-preview');
    expect(createObjectURL).toHaveBeenCalledOnce();
    lease?.release();
    lease?.release();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('removes assets only through the owning Project', async () => {
    const indexedDb = new IDBFactory();
    const repository = createIndexedDbMediaAssetRepository({ indexedDb });
    await repository.storeLocal(localInput());
    await repository.remove('project-b', assetId);
    expect(await repository.get('project-a', assetId)).not.toBeNull();

    await repository.remove('project-a', assetId);
    expect(await repository.get('project-a', assetId)).toBeNull();
  });

  it('never allows a supplied asset ID to overwrite another Project', async () => {
    const indexedDb = new IDBFactory();
    const repository = createIndexedDbMediaAssetRepository({ indexedDb });
    await repository.storeLocal(localInput('project-a'));

    await expect(repository.storeLocal(localInput('project-b'))).rejects.toThrow(
      'media-asset-project-collision',
    );
    expect(await repository.get('project-a', assetId)).not.toBeNull();
    expect(await repository.get('project-b', assetId)).toBeNull();
  });

  it('preserves safe external references without downloading remote content', async () => {
    const indexedDb = new IDBFactory();
    const repository = createIndexedDbMediaAssetRepository({ indexedDb });
    await repository.storeExternal({
      id: assetId,
      projectId: 'project-a',
      ownerType: 'catalog-item',
      ownerId: 'item-1',
      fileName: 'legacy-external-image',
      mimeType: 'image/jpeg',
      externalUrl: 'https://images.example.test/coffee.jpg',
    });

    const lease = await repository.resolveDisplayUrl('project-a', assetId);
    expect(lease?.url).toBe('https://images.example.test/coffee.jpg');
    expect(lease?.asset.source).toBe('legacy-external');
  });
});
