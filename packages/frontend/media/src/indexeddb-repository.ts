import type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';
import type {
  MediaAssetRepository,
  ResolvedMediaUrl,
  StoreExternalMediaAssetInput,
  StoreLocalMediaAssetInput,
} from './contracts';

export const mediaDatabaseName = 'barakasb.media.v1';
export const mediaDatabaseVersion = 1;
export const mediaMetadataStoreName = 'media-assets';
export const mediaBinaryStoreName = 'media-binaries';

interface MediaBinaryRecord {
  assetId: MediaAssetId;
  projectId: string;
  blob: Blob;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener(
      'error',
      () => reject(request.error ?? new Error('indexeddb-request')),
      { once: true },
    );
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener(
      'abort',
      () => reject(transaction.error ?? new Error('indexeddb-abort')),
      { once: true },
    );
    transaction.addEventListener(
      'error',
      () => reject(transaction.error ?? new Error('indexeddb-transaction')),
      { once: true },
    );
  });
}

function openMediaDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(mediaDatabaseName, mediaDatabaseVersion);
    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(mediaMetadataStoreName)) {
        database.createObjectStore(mediaMetadataStoreName, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(mediaBinaryStoreName)) {
        database.createObjectStore(mediaBinaryStoreName, { keyPath: 'assetId' });
      }
    });
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener(
      'error',
      () => reject(request.error ?? new Error('indexeddb-open')),
      { once: true },
    );
  });
}

function metadataFromLocal(input: StoreLocalMediaAssetInput): MediaAsset {
  const timestamp = new Date().toISOString();
  return {
    id: input.id,
    projectId: input.projectId,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    width: input.width,
    height: input.height,
    source: 'local-binary',
    ...(input.checksum ? { checksum: input.checksum } : {}),
    ...(input.altText ? { altText: input.altText } : {}),
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function metadataFromExternal(input: StoreExternalMediaAssetInput): MediaAsset {
  const timestamp = new Date().toISOString();
  return {
    id: input.id,
    projectId: input.projectId,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: 0,
    width: 0,
    height: 0,
    source: 'legacy-external',
    externalUrl: input.externalUrl,
    ...(input.altText ? { altText: input.altText } : {}),
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createIndexedDbMediaAssetRepository({
  indexedDb,
  objectUrl = URL,
}: {
  indexedDb: IDBFactory;
  objectUrl?: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
}): MediaAssetRepository {
  const database = openMediaDatabase(indexedDb);

  async function getMetadata(assetId: MediaAssetId): Promise<MediaAsset | null> {
    const db = await database;
    const transaction = db.transaction(mediaMetadataStoreName, 'readonly');
    const completed = transactionDone(transaction);
    const result = await requestResult<MediaAsset | undefined>(
      transaction.objectStore(mediaMetadataStoreName).get(assetId),
    );
    await completed;
    return result ?? null;
  }

  return {
    async storeLocal(input) {
      const existing = await getMetadata(input.id);
      if (existing) {
        if (existing.projectId !== input.projectId) {
          throw new Error('media-asset-project-collision');
        }
        return structuredClone(existing);
      }
      const db = await database;
      const asset = metadataFromLocal(input);
      const transaction = db.transaction(
        [mediaMetadataStoreName, mediaBinaryStoreName],
        'readwrite',
      );
      const completed = transactionDone(transaction);
      transaction.objectStore(mediaMetadataStoreName).put(asset);
      transaction.objectStore(mediaBinaryStoreName).put({
        assetId: asset.id,
        projectId: asset.projectId,
        blob: input.blob,
      } satisfies MediaBinaryRecord);
      await completed;
      return structuredClone(asset);
    },
    async storeExternal(input) {
      const existing = await getMetadata(input.id);
      if (existing) {
        if (existing.projectId !== input.projectId) {
          throw new Error('media-asset-project-collision');
        }
        return structuredClone(existing);
      }
      const db = await database;
      const asset = metadataFromExternal(input);
      const transaction = db.transaction(
        [mediaMetadataStoreName, mediaBinaryStoreName],
        'readwrite',
      );
      const completed = transactionDone(transaction);
      transaction.objectStore(mediaMetadataStoreName).put(asset);
      transaction.objectStore(mediaBinaryStoreName).delete(asset.id);
      await completed;
      return structuredClone(asset);
    },
    async get(projectId, assetId) {
      const asset = await getMetadata(assetId);
      return asset?.projectId === projectId ? structuredClone(asset) : null;
    },
    async list(projectId) {
      const db = await database;
      const transaction = db.transaction(mediaMetadataStoreName, 'readonly');
      const completed = transactionDone(transaction);
      const assets = await requestResult<MediaAsset[]>(
        transaction.objectStore(mediaMetadataStoreName).getAll(),
      );
      await completed;
      return assets
        .filter((asset) => asset.projectId === projectId)
        .map((asset) => structuredClone(asset));
    },
    async resolveDisplayUrl(projectId, assetId): Promise<ResolvedMediaUrl | null> {
      const asset = await getMetadata(assetId);
      if (!asset || asset.projectId !== projectId || asset.status !== 'active') {
        return null;
      }
      if (asset.source === 'legacy-external') {
        if (!asset.externalUrl) return null;
        return {
          asset: structuredClone(asset),
          url: asset.externalUrl,
          release() {},
        };
      }
      const db = await database;
      const transaction = db.transaction(mediaBinaryStoreName, 'readonly');
      const completed = transactionDone(transaction);
      const binary = await requestResult<MediaBinaryRecord | undefined>(
        transaction.objectStore(mediaBinaryStoreName).get(assetId),
      );
      await completed;
      if (!binary || binary.projectId !== projectId) return null;
      const url = objectUrl.createObjectURL(binary.blob);
      let released = false;
      return {
        asset: structuredClone(asset),
        url,
        release() {
          if (released) return;
          released = true;
          objectUrl.revokeObjectURL(url);
        },
      };
    },
    async remove(projectId, assetId) {
      const asset = await getMetadata(assetId);
      if (!asset || asset.projectId !== projectId) return;
      const db = await database;
      const transaction = db.transaction(
        [mediaMetadataStoreName, mediaBinaryStoreName],
        'readwrite',
      );
      const completed = transactionDone(transaction);
      transaction.objectStore(mediaMetadataStoreName).delete(assetId);
      transaction.objectStore(mediaBinaryStoreName).delete(assetId);
      await completed;
    },
    async removeProject(projectId) {
      const assets = await this.list(projectId);
      await Promise.all(assets.map((asset) => this.remove(projectId, asset.id)));
    },
  };
}
