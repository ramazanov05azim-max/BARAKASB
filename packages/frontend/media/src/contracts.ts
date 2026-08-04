import type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';

export interface StoreLocalMediaAssetInput {
  id: MediaAssetId;
  projectId: string;
  ownerType: string;
  ownerId: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  blob: Blob;
  checksum?: string;
  altText?: string;
}

export interface StoreExternalMediaAssetInput {
  id: MediaAssetId;
  projectId: string;
  ownerType: string;
  ownerId: string | null;
  fileName: string;
  mimeType: string;
  externalUrl: string;
  altText?: string;
}

export interface ResolvedMediaUrl {
  asset: MediaAsset;
  url: string;
  release(): void;
}

export interface MediaAssetRepository {
  storeLocal(input: StoreLocalMediaAssetInput): Promise<MediaAsset>;
  storeExternal(input: StoreExternalMediaAssetInput): Promise<MediaAsset>;
  get(projectId: string, assetId: MediaAssetId): Promise<MediaAsset | null>;
  list(projectId: string): Promise<MediaAsset[]>;
  resolveDisplayUrl(
    projectId: string,
    assetId: MediaAssetId,
  ): Promise<ResolvedMediaUrl | null>;
  remove(projectId: string, assetId: MediaAssetId): Promise<void>;
  removeProject(projectId: string): Promise<void>;
}

export interface UploadImageInput {
  projectId: string;
  ownerType: string;
  ownerId: string | null;
  file: Blob;
  fileName: string;
  assetId?: MediaAssetId;
  altText?: string;
}

export interface ImportExternalImageInput {
  projectId: string;
  ownerType: string;
  ownerId: string | null;
  externalUrl: string;
  assetId?: MediaAssetId;
  altText?: string;
}

export interface MediaAssetService {
  uploadImage(input: UploadImageInput): Promise<MediaAsset>;
  importExternalImage(input: ImportExternalImageInput): Promise<MediaAsset>;
  get(projectId: string, assetId: MediaAssetId): Promise<MediaAsset | null>;
  list(projectId: string): Promise<MediaAsset[]>;
  resolveDisplayUrl(
    projectId: string,
    assetId: MediaAssetId,
  ): Promise<ResolvedMediaUrl | null>;
  remove(projectId: string, assetId: MediaAssetId): Promise<void>;
  removeProject(projectId: string): Promise<void>;
}
