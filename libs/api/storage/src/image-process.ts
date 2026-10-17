import { ErrorCode } from '@work-hub/constants';
import sharp from 'sharp';

export class ImageProcessError extends Error {
  constructor(
    readonly code: (typeof ErrorCode)[keyof typeof ErrorCode],
    message: string
  ) {
    super(message);
    this.name = 'ImageProcessError';
  }
}

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Cap decoded pixels (~8000×5000) so a tiny compressed “pixel bomb” can’t OOM us. */
export const IMAGE_LIMIT_INPUT_PIXELS = 40_000_000;

async function decode(buffer: Buffer) {
  try {
    const image = sharp(buffer, {
      failOn: 'error',
      limitInputPixels: IMAGE_LIMIT_INPUT_PIXELS,
    }).rotate();
    const meta = await image.metadata();
    const format = meta.format;
    const mime =
      format === 'jpeg'
        ? 'image/jpeg'
        : format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : null;
    if (!mime || !ACCEPTED.has(mime)) {
      throw new ImageProcessError(
        ErrorCode.IMAGE_UNSUPPORTED_TYPE,
        'Only PNG, JPEG and WebP images are allowed'
      );
    }
    return { image, meta };
  } catch (error) {
    if (error instanceof ImageProcessError) {
      throw error;
    }
    throw new ImageProcessError(
      ErrorCode.IMAGE_UNSUPPORTED_TYPE,
      'File is not a valid image'
    );
  }
}

/** Square logo/avatar: 256 and 64 WebP, no EXIF. */
export async function processSquareImage(buffer: Buffer, maxBytes: number) {
  if (buffer.byteLength > maxBytes) {
    throw new ImageProcessError(
      ErrorCode.IMAGE_TOO_LARGE,
      'Image must be 2 MB or smaller'
    );
  }
  const { image, meta } = await decode(buffer);
  if ((meta.width ?? 0) < 128 || (meta.height ?? 0) < 128) {
    throw new ImageProcessError(
      ErrorCode.IMAGE_TOO_SMALL,
      'Image must be at least 128×128'
    );
  }
  const webp256 = await image
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();
  const webp64 = await sharp(webp256)
    .resize(64, 64, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  return { webp256, webp64 };
}

/** Cover: 1600 and 3200 wide WebP. */
export async function processCover(buffer: Buffer, maxBytes: number) {
  if (buffer.byteLength > maxBytes) {
    throw new ImageProcessError(
      ErrorCode.IMAGE_TOO_LARGE,
      'Cover must be 5 MB or smaller'
    );
  }
  const { image, meta } = await decode(buffer);
  if ((meta.width ?? 0) < 1200) {
    throw new ImageProcessError(
      ErrorCode.IMAGE_TOO_SMALL,
      'Cover must be at least 1200 px wide'
    );
  }
  const webp1600 = await image
    .clone()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const webp3200 = await image
    .clone()
    .resize({ width: 3200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return { webp1600, webp3200 };
}
