export type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';
export type {
  ImportExternalImageInput,
  MediaAssetRepository,
  MediaAssetService,
  ResolvedMediaUrl,
  StoreExternalMediaAssetInput,
  StoreLocalMediaAssetInput,
  UploadImageInput,
} from './contracts';
export {
  containedImageDimensions,
  mediaImagePolicy,
  MediaValidationError,
  normalizeImage,
  type DecodedImage,
  type ImageNormalizationEnvironment,
  type MediaValidationErrorCode,
  type NormalizedImage,
} from './image-normalization';
export {
  createIndexedDbMediaAssetRepository,
  mediaBinaryStoreName,
  mediaDatabaseName,
  mediaDatabaseVersion,
  mediaMetadataStoreName,
} from './indexeddb-repository';
export { createMediaAssetService, getBrowserMediaAssetService } from './media-service';
