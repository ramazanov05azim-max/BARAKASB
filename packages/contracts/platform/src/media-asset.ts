export type MediaAssetId = string & { readonly __mediaAssetId: unique symbol };

export type MediaAssetStatus = 'active' | 'quarantined';
export type MediaAssetSource = 'local-binary' | 'legacy-external';

export interface MediaAsset {
  id: MediaAssetId;
  projectId: string;
  ownerType: string;
  ownerId: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  source: MediaAssetSource;
  externalUrl?: string;
  checksum?: string;
  altText?: string;
  status: MediaAssetStatus;
  createdAt: string;
  updatedAt: string;
}
