import { COVER_PRESETS, type CoverPreset } from '@work-hub/constants';

/** CSS backgrounds for named cover presets (WH-047). */
export const COVER_PRESET_STYLES: Record<CoverPreset, string> = {
  aurora: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 50%, #7c3aed 100%)',
  dusk: 'linear-gradient(135deg, #1e293b 0%, #7c2d12 50%, #9f1239 100%)',
  forest: 'linear-gradient(160deg, #14532d 0%, #166534 40%, #365314 100%)',
  slate: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)',
  sand: 'linear-gradient(135deg, #a16207 0%, #ca8a04 40%, #d6d3d1 100%)',
  ocean: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0e7490 100%)',
  ember: 'linear-gradient(135deg, #7f1d1d 0%, #c2410c 50%, #b45309 100%)',
  lilac: 'linear-gradient(135deg, #4c1d95 0%, #7e22ce 45%, #a21caf 100%)',
};

export function isCoverPreset(value: string): value is CoverPreset {
  return (COVER_PRESETS as readonly string[]).includes(value);
}
