import type { MediaAssetId } from '@barakasb/contracts-platform';
import type { MediaAssetService } from '@barakasb/frontend-media';
import type { CoffeeSnapshot, MenuCategory, MenuItem } from './domain';

type CatalogImageEntity = MenuItem | MenuCategory;

interface LegacyCatalogImage {
  imagePlaceholder?: unknown;
}

export interface MenuImageMigrationResult {
  snapshot: CoffeeSnapshot;
  migratedCount: number;
  failedCount: number;
}

async function deterministicHash(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value),
    );
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function legacyMediaAssetId(
  projectId: string,
  itemId: string,
  legacyValue: string,
): Promise<MediaAssetId> {
  return deterministicHash(`${projectId}\u0000${itemId}\u0000${legacyValue}`).then(
    (hash) => `media-legacy-${hash}` as MediaAssetId,
  );
}

export function legacyDataUrlToBlob(dataUrl: string): {
  blob: Blob;
  fileName: string;
} {
  const match = /^data:(image\/[a-z0-9.+-]+)(;base64)?,([\s\S]*)$/iu.exec(dataUrl);
  if (!match?.[1] || match[3] === undefined) {
    throw new Error('invalid-legacy-data-url');
  }
  const mimeType = match[1].toLowerCase();
  const encoded = match[3];
  const binary = match[2] ? globalThis.atob(encoded) : decodeURIComponent(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const extension =
    mimeType === 'image/jpeg'
      ? 'jpg'
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'image';
  return {
    blob: new Blob([bytes], { type: mimeType }),
    fileName: `legacy-menu-image.${extension}`,
  };
}

function legacyImageValue(item: CatalogImageEntity): string | null {
  const value = (item as CatalogImageEntity & LegacyCatalogImage).imagePlaceholder;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function removeLegacyField(item: CatalogImageEntity): void {
  delete (item as CatalogImageEntity & LegacyCatalogImage).imagePlaceholder;
}

export async function migrateLegacyMenuImages({
  projectId,
  snapshot,
  mediaAssets,
  persist,
}: {
  projectId: string;
  snapshot: CoffeeSnapshot;
  mediaAssets: MediaAssetService;
  persist(snapshot: CoffeeSnapshot): Promise<void> | void;
}): Promise<MenuImageMigrationResult> {
  const next = structuredClone(snapshot);
  let migratedCount = 0;
  let failedCount = 0;
  let changed = false;

  const targets: Array<{
    entity: CatalogImageEntity;
    ownerType: 'catalog-item' | 'catalog-category';
  }> = [
    ...next.menuItems.map((entity) => ({
      entity,
      ownerType: 'catalog-item' as const,
    })),
    ...(next.menuCategories ?? []).map((entity) => ({
      entity,
      ownerType: 'catalog-category' as const,
    })),
  ];

  for (const { entity, ownerType } of targets) {
    const legacyValue = legacyImageValue(entity);
    if (!legacyValue) continue;
    if (entity.imageAssetId) {
      removeLegacyField(entity);
      changed = true;
      continue;
    }

    const assetId = await legacyMediaAssetId(projectId, entity.id, legacyValue);
    try {
      const common = {
        projectId,
        ownerType,
        ownerId: entity.id,
        assetId,
        altText: entity.name,
      };
      let asset;
      if (legacyValue.startsWith('data:')) {
        const legacyFile = legacyDataUrlToBlob(legacyValue);
        asset = await mediaAssets.uploadImage({
          ...common,
          file: legacyFile.blob,
          fileName: legacyFile.fileName,
        });
      } else {
        asset = await mediaAssets.importExternalImage({
          ...common,
          externalUrl: legacyValue,
        });
      }
      entity.imageAssetId = asset.id;
      removeLegacyField(entity);
      migratedCount += 1;
      changed = true;
    } catch {
      failedCount += 1;
    }
  }

  if (changed) await persist(next);
  return { snapshot: changed ? next : snapshot, migratedCount, failedCount };
}

export function readLegacyMenuImage(item: CatalogImageEntity): string | null {
  return legacyImageValue(item);
}
