import { describe, expect, it, vi } from 'vitest';
import {
  containedImageDimensions,
  mediaImagePolicy,
  MediaValidationError,
  normalizeImage,
  type ImageNormalizationEnvironment,
} from './image-normalization';

function environment(
  width: number,
  height: number,
): ImageNormalizationEnvironment & { release: ReturnType<typeof vi.fn> } {
  const release = vi.fn();
  return {
    release,
    decode: vi.fn(async () => ({ source: {}, width, height, release })),
    encode: vi.fn(
      async (_source, _width, _height, mimeType) =>
        new Blob(['normalized'], { type: mimeType }),
    ),
  };
}

describe('platform image normalization policy', () => {
  it('limits the longest edge without upscaling small images', () => {
    expect(containedImageDimensions(3200, 2400)).toEqual({
      width: 1600,
      height: 1200,
    });
    expect(containedImageDimensions(640, 480)).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('normalizes supported input to the shared WebP policy and releases decoding', async () => {
    const adapter = environment(3200, 2400);
    const result = await normalizeImage(
      new Blob(['input'], { type: 'image/png' }),
      adapter,
    );

    expect(result).toMatchObject({
      mimeType: 'image/webp',
      width: 1600,
      height: 1200,
    });
    expect(adapter.encode).toHaveBeenCalledWith(
      {},
      1600,
      1200,
      mediaImagePolicy.outputMimeType,
      mediaImagePolicy.outputQuality,
    );
    expect(adapter.release).toHaveBeenCalledOnce();
  });

  it('rejects unsupported MIME types before decoding', async () => {
    const adapter = environment(100, 100);
    await expect(
      normalizeImage(new Blob(['svg'], { type: 'image/svg+xml' }), adapter),
    ).rejects.toMatchObject({
      code: 'unsupported-type',
    } satisfies Partial<MediaValidationError>);
    expect(adapter.decode).not.toHaveBeenCalled();
  });

  it('rejects oversized files before decoding', async () => {
    const adapter = environment(100, 100);
    const oversized = new Blob(
      [new Uint8Array(mediaImagePolicy.maximumInputBytes + 1)],
      { type: 'image/jpeg' },
    );
    await expect(normalizeImage(oversized, adapter)).rejects.toMatchObject({
      code: 'file-too-large',
    } satisfies Partial<MediaValidationError>);
    expect(adapter.decode).not.toHaveBeenCalled();
  });
});
