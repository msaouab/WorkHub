import { PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from '@work-hub/constants';
import { describe, expect, it } from 'vitest';
import {
  SPACE_NAV_ITEMS,
  activeSpaceNavId,
  filterSpaceNav,
} from '../src/lib/nav/space-nav';
import {
  SETTINGS_NAV_ITEMS,
  activeSettingsNavId,
} from '../src/lib/nav/settings-nav';

describe('filterSpaceNav', () => {
  it('shows Manage → Settings for Owner and hides Manage for Member', () => {
    const owner = filterSpaceNav(
      SPACE_NAV_ITEMS,
      SYSTEM_ROLE_PERMISSIONS.Owner
    );
    expect(owner.map((i) => i.id)).toEqual(['home', 'settings']);

    const member = filterSpaceNav(
      SPACE_NAV_ITEMS,
      SYSTEM_ROLE_PERMISSIONS.Member
    );
    expect(member.map((i) => i.id)).toEqual(['home']);
    expect(
      member.some((i) => i.permission === PERMISSIONS.SPACE_SETTINGS_WRITE)
    ).toBe(false);
  });
});

describe('activeSpaceNavId', () => {
  const slug = 'acme';
  const items = SPACE_NAV_ITEMS;

  it('highlights Home only on the workspace root', () => {
    expect(activeSpaceNavId(items, slug, '/s/acme')).toBe('home');
    expect(activeSpaceNavId(items, slug, '/s/acme/settings')).toBe('settings');
  });
});

describe('activeSettingsNavId', () => {
  it('prefers the longer settings path', () => {
    expect(activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings')).toBe('profile');
    expect(activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings/language')).toBe(
      'language'
    );
    expect(activeSettingsNavId(SETTINGS_NAV_ITEMS, '/settings/password')).toBe(
      'password'
    );
  });
});
