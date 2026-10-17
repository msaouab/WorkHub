'use client';

import type { Permission } from '@work-hub/constants';
import { useCurrentSpace } from '@/hooks/use-space';

/**
 * Whether the current workspace membership includes `permission` (WH-019).
 * UX only — the API still returns 403 if called without the right.
 */
export function useCan(permission: Permission): boolean {
  const { space } = useCurrentSpace();
  if (!space) {
    return false;
  }
  return space.permissions.includes(permission);
}
