import type { MeSpace } from '@work-hub/contracts';
import { getLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';

/**
 * Where to send the user right after sign-in (WH-052).
 * Dashboard itself no longer redirects on every visit.
 */
export function resolvePostAuthPath(spaces: MeSpace[]): string {
  if (spaces.length === 0) {
    return ROUTES.spacesNew;
  }
  const only = spaces[0];
  if (spaces.length === 1 && only) {
    return `${ROUTES.space}/${only.slug}`;
  }
  const last = getLastSpaceSlug();
  const match = last ? spaces.find((s) => s.slug === last) : undefined;
  if (match) {
    return `${ROUTES.space}/${match.slug}`;
  }
  return ROUTES.spaces;
}
