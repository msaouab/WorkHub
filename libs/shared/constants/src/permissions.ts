/**
 * Permission names shared by API guards and the client (`useCan`).
 * Keep stable — stored on `roles.permissions` and checked per request (NFR-02).
 */
export const PERMISSIONS = {
  SPACE_SETTINGS_WRITE: 'space.settings.write',
  SPACE_DELETE: 'space.delete',
  SPACE_BILLING_WRITE: 'space.billing.write',
  MEMBERS_READ: 'members.read',
  MEMBERS_WRITE: 'members.write',
  ROLES_WRITE: 'roles.write',
  TEAMS_WRITE: 'teams.write',
  INVITES_WRITE: 'invites.write',
  LEAVE_TYPES_WRITE: 'leave_types.write',
  HOLIDAYS_WRITE: 'holidays.write',
  BALANCES_ADJUST: 'balances.adjust',
  LEAVE_APPROVE: 'leave.approve',
  DOCUMENTS_FULFIL: 'documents.fulfil',
  CALENDAR_READ: 'calendar.read',
  REQUESTS_CREATE: 'requests.create',
  PROFILE_WRITE: 'profile.write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LIST = Object.values(PERMISSIONS);

/** Built-in roles created with every workspace (WH-038 / WH-039). */
export const SYSTEM_ROLE_NAMES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
} as const;

export type SystemRoleName =
  (typeof SYSTEM_ROLE_NAMES)[keyof typeof SYSTEM_ROLE_NAMES];

export const SYSTEM_ROLE_NAME_LIST = Object.values(SYSTEM_ROLE_NAMES);

const OWNER_ONLY = new Set<Permission>([
  PERMISSIONS.SPACE_SETTINGS_WRITE,
  PERMISSIONS.SPACE_DELETE,
  PERMISSIONS.SPACE_BILLING_WRITE,
]);

const MEMBER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.MEMBERS_READ,
  PERMISSIONS.CALENDAR_READ,
  PERMISSIONS.REQUESTS_CREATE,
  PERMISSIONS.PROFILE_WRITE,
];

/** Permissions granted to each system role (PRD §4 Roles). */
export const SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRoleName,
  readonly Permission[]
> = {
  [SYSTEM_ROLE_NAMES.OWNER]: PERMISSION_LIST,
  [SYSTEM_ROLE_NAMES.ADMIN]: PERMISSION_LIST.filter((p) => !OWNER_ONLY.has(p)),
  [SYSTEM_ROLE_NAMES.MEMBER]: MEMBER_PERMISSIONS,
};

/** True when every preset permission is in the catalog (and Member ⊆ Admin ⊆ Owner). */
export function systemRolePresetsAreConsistent(): boolean {
  const catalog = new Set<Permission>(PERMISSION_LIST);
  const owner = new Set<Permission>(
    SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.OWNER]
  );
  const admin = new Set<Permission>(
    SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.ADMIN]
  );
  const member = new Set<Permission>(
    SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.MEMBER]
  );

  for (const role of SYSTEM_ROLE_NAME_LIST) {
    for (const permission of SYSTEM_ROLE_PERMISSIONS[role]) {
      if (!catalog.has(permission)) {
        return false;
      }
    }
  }

  if (owner.size !== catalog.size) {
    return false;
  }
  for (const permission of catalog) {
    if (!owner.has(permission)) {
      return false;
    }
  }

  for (const permission of admin) {
    if (!owner.has(permission) || OWNER_ONLY.has(permission)) {
      return false;
    }
  }

  for (const permission of member) {
    if (!admin.has(permission)) {
      return false;
    }
  }

  return true;
}
