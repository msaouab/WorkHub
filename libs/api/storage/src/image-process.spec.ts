import { ErrorCode } from '@work-hub/constants';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  ImageProcessError,
  processCover,
  processSquareImage,
} from './image-process';

async function jpeg(width: number, height: number, withGps = false) {
  const base = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 40, g: 120, b: 200 },
    },
  }).jpeg();

  if (!withGps) {
    return base.toBuffer();
  }

  return base
    .withExif({
      IFD0: { ImageDescription: 'test' },
      GPS: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '48/1 51/1 0/1',
        GPSLongitudeRef: 'E',
        GPSLongitude: '2/1 21/1 0/1',
      },
    })
    .toBuffer();
}

describe('processSquareImage', () => {
  it('returns 256 and 64 WebP without EXIF', async () => {
    const input = await jpeg(256, 256, true);
    const { webp256, webp64 } = await processSquareImage(
      input,
      2 * 1024 * 1024
    );
    const meta256 = await sharp(webp256).metadata();
    const meta64 = await sharp(webp64).metadata();
    expect(meta256.format).toBe('webp');
    expect(meta256.width).toBe(256);
    expect(meta256.height).toBe(256);
    expect(meta256.exif).toBeUndefined();
    expect(meta64.width).toBe(64);
    expect(meta64.height).toBe(64);
  });

  it('rejects files that are too large', async () => {
    const input = await jpeg(200, 200);
    await expect(processSquareImage(input, 10)).rejects.toMatchObject({
      code: ErrorCode.IMAGE_TOO_LARGE,
    } satisfies Partial<ImageProcessError>);
  });

  it('rejects images that are too small', async () => {
    const input = await jpeg(50, 50);
    await expect(
      processSquareImage(input, 2 * 1024 * 1024)
    ).rejects.toMatchObject({
      code: ErrorCode.IMAGE_TOO_SMALL,
    });
  });

  it('rejects non-images', async () => {
    await expect(
      processSquareImage(Buffer.from('not-an-image'), 2 * 1024 * 1024)
    ).rejects.toMatchObject({ code: ErrorCode.IMAGE_UNSUPPORTED_TYPE });
  });

  it('rejects pixel-bomb images over limitInputPixels', async () => {
    // 12000×12000 ≈ 144 M pixels > IMAGE_LIMIT_INPUT_PIXELS (40 M).
    const bomb = await sharp({
      create: {
        width: 12_000,
        height: 12_000,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await expect(
      processSquareImage(bomb, 50 * 1024 * 1024)
    ).rejects.toMatchObject({ code: ErrorCode.IMAGE_UNSUPPORTED_TYPE });
  });
});

describe('processCover', () => {
  it('returns 1600 and 3200-wide WebP', async () => {
    const input = await jpeg(2400, 800);
    const { webp1600, webp3200 } = await processCover(
      input,
      5 * 1024 * 1024
    );
    const meta1600 = await sharp(webp1600).metadata();
    const meta3200 = await sharp(webp3200).metadata();
    expect(meta1600.format).toBe('webp');
    expect(meta1600.width).toBe(1600);
    expect(meta3200.width).toBe(2400);
  });

  it('rejects covers under 1200 px wide', async () => {
    const input = await jpeg(800, 400);
    await expect(processCover(input, 5 * 1024 * 1024)).rejects.toMatchObject({
      code: ErrorCode.IMAGE_TOO_SMALL,
    });
  });
});
