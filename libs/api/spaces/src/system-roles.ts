import {
  SYSTEM_ROLE_NAME_LIST,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
  type Permission,
  type SystemRoleName,
} from '@work-hub/constants';
import { uuidv7 } from '@work-hub/database';

export type SystemRoleRow = {
  id: string;
  spaceId: string;
  name: SystemRoleName;
  permissions: Permission[];
  isSystem: true;
};

/**
 * Owner / Admin / Member rows for a new workspace (WH-038 / WH-040).
 * Shared by `SpacesService.create` and the Acme seed so permissions stay in sync.
 */
export function systemRolesFor(spaceId: string): {
  roles: SystemRoleRow[];
  defaultRoleId: string;
  roleIds: Record<SystemRoleName, string>;
} {
  const roleIds = {
    [SYSTEM_ROLE_NAMES.OWNER]: uuidv7(),
    [SYSTEM_ROLE_NAMES.ADMIN]: uuidv7(),
    [SYSTEM_ROLE_NAMES.MEMBER]: uuidv7(),
  } as const;

  const roles: SystemRoleRow[] = SYSTEM_ROLE_NAME_LIST.map((name) => ({
    id: roleIds[name],
    spaceId,
    name,
    permissions: [...SYSTEM_ROLE_PERMISSIONS[name]],
    isSystem: true,
  }));

  return {
    roles,
    defaultRoleId: roleIds[SYSTEM_ROLE_NAMES.MEMBER],
    roleIds: { ...roleIds },
  };
}
