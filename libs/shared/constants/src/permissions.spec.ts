import { describe, expect, it } from 'vitest';
import {
  PERMISSION_LIST,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
  systemRolePresetsAreConsistent,
} from './permissions';

describe('permission catalog', () => {
  it('keeps system presets inside the catalog with Owner ⊇ Admin ⊇ Member', () => {
    expect(systemRolePresetsAreConsistent()).toBe(true);
  });

  it('gives Owner every permission and Admin none of the owner-only ones', () => {
    expect(SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.OWNER]).toEqual(
      PERMISSION_LIST
    );
    expect(
      SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.ADMIN]
    ).not.toContain(PERMISSIONS.SPACE_DELETE);
    expect(
      SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.ADMIN]
    ).not.toContain(PERMISSIONS.SPACE_BILLING_WRITE);
    expect(
      SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.ADMIN]
    ).not.toContain(PERMISSIONS.SPACE_SETTINGS_WRITE);
  });

  it('gives Member only the employee baseline', () => {
    expect(SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.MEMBER]).toEqual([
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.CALENDAR_READ,
      PERMISSIONS.REQUESTS_CREATE,
      PERMISSIONS.PROFILE_WRITE,
    ]);
  });
});
