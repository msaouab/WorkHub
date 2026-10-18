import { PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from '@work-hub/constants';
import { describe, expect, it } from 'vitest';
import {
  SPACE_NAV_ITEMS,
  activeSpaceNavId,
  filterSpaceNav,
  hasNavPermission,
} from '../src/lib/nav/space-nav';
import {
  SETTINGS_NAV_ITEMS,
  activeSettingsNavId,
} from '../src/lib/nav/settings-nav';

describe('hasNavPermission', () => {
  it('treats permission arrays as any-of', () => {
    expect(
      hasNavPermission([PERMISSIONS.LEAVE_APPROVE], [
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.DOCUMENTS_FULFIL,
      ])
    ).toBe(true);
    expect(
      hasNavPermission([PERMISSIONS.MEMBERS_READ], [
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.DOCUMENTS_FULFIL,
      ])
    ).toBe(false);
  });
});

describe('filterSpaceNav', () => {
  it('lists main + Manage for Owner, main only for Member', () => {
    const owner = filterSpaceNav(
      SPACE_NAV_ITEMS,
      SYSTEM_ROLE_PERMISSIONS.Owner
    );
    expect(owner.map((i) => i.id)).toEqual([
      'home',
      'leave',
      'calendar',
      'holidays',
      'documents',
      'team',
      'approvals',
      'roles',
      'leavePolicies',
      'settings',
    ]);
    expect(owner.some((i) => i.section === 'manage')).toBe(true);

    const member = filterSpaceNav(
      SPACE_NAV_ITEMS,
      SYSTEM_ROLE_PERMISSIONS.Member
    );
    expect(member.map((i) => i.id)).toEqual([
      'home',
      'leave',
      'calendar',
      'holidays',
      'documents',
      'team',
    ]);
    expect(member.every((i) => i.section === 'main')).toBe(true);
  });

  it('hides Settings for Admin but keeps other Manage items', () => {
    const admin = filterSpaceNav(
      SPACE_NAV_ITEMS,
      SYSTEM_ROLE_PERMISSIONS.Admin
    );
    expect(admin.map((i) => i.id)).toContain('approvals');
    expect(admin.map((i) => i.id)).toContain('roles');
    expect(admin.map((i) => i.id)).not.toContain('settings');
  });
});

describe('activeSpaceNavId', () => {
  const slug = 'acme';
  const items = SPACE_NAV_ITEMS;

  it('highlights Home only on the workspace root', () => {
    expect(activeSpaceNavId(items, slug, '/s/acme')).toBe('home');
    expect(activeSpaceNavId(items, slug, '/s/acme/settings')).toBe('settings');
    expect(activeSpaceNavId(items, slug, '/s/acme/team')).toBe('team');
  });
});

describe('SPACE_NAV_ITEMS readiness', () => {
  it('marks Team as ready', () => {
    expect(SPACE_NAV_ITEMS.find((i) => i.id === 'team')?.status).toBe('ready');
  });
});

describe('activeSettingsNavId', () => {
  it('matches settings routes', () => {
    expect(activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings')).toBe('profile');
    expect(activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings/language')).toBe(
      'language'
    );
    expect(
      activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings/sign-in-methods')
    ).toBe('signInMethods');
    expect(
      activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings/delete-account')
    ).toBe('deleteAccount');
  });
});
