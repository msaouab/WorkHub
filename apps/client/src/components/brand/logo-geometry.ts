/**
 * Shared geometry and palette for the hub monogram (a W drawn through connected nodes).
 * Used by the static mark and the animated loader. Mirrored in app/icon.svg and
 * public/brand/*.svg — keep them in sync.
 *
 * Plain module (no 'use client') so server components can import it too.
 */

export type LogoTone = 'default' | 'inverse';

export const MARK_VIEWBOX = '0 0 64 64';
export const MARK_TILE_RADIUS = 15;
export const MARK_STROKE_WIDTH = 4.5;
export const MARK_NODE_RADIUS = 4.5;
export const MARK_PATH = 'M14 20l9 25 9-17 9 17 9-25';

/** Nodes sit on the three top vertices of the W, in drawing order (start, middle, end). */
export const MARK_NODES = [
  { cx: 14, cy: 20 },
  { cx: 32, cy: 28 },
  { cx: 50, cy: 20 },
] as const;

/** `inverse` is for dark or photographic backgrounds (e.g. the landing hero). */
export const MARK_TONE = {
  default: {
    tile: 'fill-brand',
    line: 'stroke-brand-ink',
    node: 'fill-brand-node',
  },
  inverse: {
    tile: 'fill-white',
    line: 'stroke-brand',
    node: 'fill-brand-node-strong',
  },
} as const satisfies Record<LogoTone, { tile: string; line: string; node: string }>;
