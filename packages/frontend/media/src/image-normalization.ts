export const mediaImagePolicy = {
  acceptedInputMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maximumInputBytes: 10 * 1024 * 1024,
  maximumStoredDimension: 1600,
  outputMimeType: 'image/webp',
  outputQuality: 0.82,
} as const;

export type MediaValidationErrorCode =
  'unsupported-type' | 'file-too-large' | 'normalization-failed';

export class MediaValidationError extends Error {
  constructor(public readonly code: MediaValidationErrorCode) {
    super(code);
    this.name = 'MediaValidationError';
  }
}

export interface DecodedImage {
  source: unknown;
  width: number;
  height: number;
  release(): void;
}

export interface ImageNormalizationEnvironment {
  decode(blob: Blob): Promise<DecodedImage>;
  encode(
    source: unknown,
    width: number,
    height: number,
    mimeType: string,
    quality: number,
  ): Promise<Blob>;
}

export interface NormalizedImage {
  blob: Blob;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
}

export function containedImageDimensions(
  width: number,
  height: number,
  maximumDimension = mediaImagePolicy.maximumStoredDimension,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    throw new MediaValidationError('normalization-failed');
  }
  const scale = Math.min(1, maximumDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function normalizeImage(
  file: Blob,
  environment: ImageNormalizationEnvironment = browserImageNormalizationEnvironment,
): Promise<NormalizedImage> {
  if (
    !(mediaImagePolicy.acceptedInputMimeTypes as readonly string[]).includes(file.type)
  ) {
    throw new MediaValidationError('unsupported-type');
  }
  if (file.size > mediaImagePolicy.maximumInputBytes) {
    throw new MediaValidationError('file-too-large');
  }

  let decoded: DecodedImage | null = null;
  try {
    decoded = await environment.decode(file);
    const dimensions = containedImageDimensions(decoded.width, decoded.height);
    const blob = await environment.encode(
      decoded.source,
      dimensions.width,
      dimensions.height,
      mediaImagePolicy.outputMimeType,
      mediaImagePolicy.outputQuality,
    );
    return {
      blob,
      mimeType: mediaImagePolicy.outputMimeType,
      byteSize: blob.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    if (error instanceof MediaValidationError) throw error;
    throw new MediaValidationError('normalization-failed');
  } finally {
    decoded?.release();
  }
}

async function decodeWithImageElement(blob: Blob): Promise<DecodedImage> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => reject(new Error('image-decode')), {
        once: true,
      });
      image.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

const browserImageNormalizationEnvironment: ImageNormalizationEnvironment = {
  async decode(blob) {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    }
    return decodeWithImageElement(blob);
  },
  async encode(source, width, height, mimeType, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas-context');
    context.drawImage(source as CanvasImageSource, 0, 0, width, height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas-encode'))),
        mimeType,
        quality,
      );
    });
  },
};
