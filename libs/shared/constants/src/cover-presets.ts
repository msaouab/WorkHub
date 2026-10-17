/** Named cover gradients shipped in the web app (WH-047). */
export const COVER_PRESETS = [
  'aurora',
  'dusk',
  'forest',
  'slate',
  'sand',
  'ocean',
  'ember',
  'lilac',
] as const;

export type CoverPreset = (typeof COVER_PRESETS)[number];

/** Deterministic default preset from a space id. */
export function defaultCoverPreset(spaceId: string): CoverPreset {
  let hash = 0;
  for (let i = 0; i < spaceId.length; i += 1) {
    hash = (hash * 31 + spaceId.charCodeAt(i)) >>> 0;
  }
  return COVER_PRESETS[hash % COVER_PRESETS.length]!;
}
