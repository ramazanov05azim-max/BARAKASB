import type { MediaAssetId } from '@barakasb/contracts-platform';
import type {
  ImportExternalImageInput,
  MediaAssetRepository,
  MediaAssetService,
  UploadImageInput,
} from './contracts';
import {
  normalizeImage,
  type ImageNormalizationEnvironment,
} from './image-normalization';
import { createIndexedDbMediaAssetRepository } from './indexeddb-repository';

function createMediaAssetId(): MediaAssetId {
  return `media-${globalThis.crypto.randomUUID()}` as MediaAssetId;
}

async function checksum(blob: Blob): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined;
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    await blob.arrayBuffer(),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function assertExternalImageUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('invalid-external-media-url');
  }
  return url;
}

export function createMediaAssetService(
  repository: MediaAssetRepository,
  normalizationEnvironment?: ImageNormalizationEnvironment,
): MediaAssetService {
  return {
    async uploadImage(input: UploadImageInput) {
      const normalized = await normalizeImage(input.file, normalizationEnvironment);
      const normalizedChecksum = await checksum(normalized.blob);
      return repository.storeLocal({
        id: input.assetId ?? createMediaAssetId(),
        projectId: input.projectId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        fileName: input.fileName,
        mimeType: normalized.mimeType,
        byteSize: normalized.byteSize,
        width: normalized.width,
        height: normalized.height,
        blob: normalized.blob,
        ...(normalizedChecksum ? { checksum: normalizedChecksum } : {}),
        ...(input.altText ? { altText: input.altText } : {}),
      });
    },
    async importExternalImage(input: ImportExternalImageInput) {
      const externalUrl = assertExternalImageUrl(input.externalUrl).toString();
      return repository.storeExternal({
        id: input.assetId ?? createMediaAssetId(),
        projectId: input.projectId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        fileName: 'legacy-external-image',
        mimeType: 'image/jpeg',
        externalUrl,
        ...(input.altText ? { altText: input.altText } : {}),
      });
    },
    get: (projectId, assetId) => repository.get(projectId, assetId),
    list: (projectId) => repository.list(projectId),
    resolveDisplayUrl: (projectId, assetId) =>
      repository.resolveDisplayUrl(projectId, assetId),
    remove: (projectId, assetId) => repository.remove(projectId, assetId),
    removeProject: (projectId) => repository.removeProject(projectId),
  };
}

let browserService: MediaAssetService | null = null;

export function getBrowserMediaAssetService(): MediaAssetService {
  if (browserService) return browserService;
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('browser-media-unavailable');
  }
  browserService = createMediaAssetService(createIndexedDbRepository(window.indexedDB));
  return browserService;
}

function createIndexedDbRepository(indexedDb: IDBFactory): MediaAssetRepository {
  // Kept behind this function so server rendering never evaluates browser storage.
  return createIndexedDbMediaAssetRepository({ indexedDb });
}
