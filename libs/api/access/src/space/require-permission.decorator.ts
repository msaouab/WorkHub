import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@work-hub/constants';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

/** Route needs this permission on the role SpaceGuard just loaded. */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
