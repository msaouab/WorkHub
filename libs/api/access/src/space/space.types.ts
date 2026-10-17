import type { Permission } from '@work-hub/constants';

/** Attached by SpaceGuard after a fresh membership + role load. */
export type SpaceAccess = {
  spaceId: string;
  userId: string;
  membershipId: string;
  membershipStatus: 'active' | 'deactivated';
  roleId: string;
  roleName: string;
  permissions: readonly Permission[];
};

export const SPACE_ACCESS_KEY = 'spaceAccess';
