import type { CoverPreset } from '@work-hub/constants';
import type { SpaceCover, SpaceLogo } from '@work-hub/contracts';
import type { StorageService } from '@work-hub/storage';

export type SpaceBrandingRow = {
  logoKey: string | null;
  coverKey: string | null;
  coverPreset: string | null;
  coverPositionY: number;
};

/** Build API branding URLs from stored keys (client never assembles keys). */
export function brandingFromRow(
  row: SpaceBrandingRow,
  storage: StorageService
): {
  logo: SpaceLogo | null;
  cover: SpaceCover | null;
  coverPositionY: number;
} {
  const logo = row.logoKey
    ? {
        url64: storage.publicUrl(`${row.logoKey}/64.webp`),
        url256: storage.publicUrl(`${row.logoKey}/256.webp`),
      }
    : null;

  let cover: SpaceCover | null = null;
  if (row.coverKey) {
    cover = {
      kind: 'image',
      url1600: storage.publicUrl(`${row.coverKey}/1600.webp`),
      url3200: storage.publicUrl(`${row.coverKey}/3200.webp`),
    };
  } else if (row.coverPreset) {
    cover = {
      kind: 'preset',
      preset: row.coverPreset as CoverPreset,
    };
  }

  return { logo, cover, coverPositionY: row.coverPositionY };
}
