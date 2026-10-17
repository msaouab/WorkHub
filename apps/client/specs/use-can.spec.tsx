import { renderHook } from '@testing-library/react';
import { PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from '@work-hub/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCan } from '../src/hooks/use-can';

const mocks = vi.hoisted(() => ({
  useCurrentSpace: vi.fn(),
}));

vi.mock('@/hooks/use-space', () => ({
  useCurrentSpace: mocks.useCurrentSpace,
}));

describe('useCan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is false when there is no current workspace', () => {
    mocks.useCurrentSpace.mockReturnValue({ space: null });
    const { result } = renderHook(() =>
      useCan(PERMISSIONS.SPACE_SETTINGS_WRITE)
    );
    expect(result.current).toBe(false);
  });

  it('is true for Owner on space.settings.write and false for Member', () => {
    mocks.useCurrentSpace.mockReturnValue({
      space: {
        permissions: SYSTEM_ROLE_PERMISSIONS.Owner,
      },
    });
    const { result: owner } = renderHook(() =>
      useCan(PERMISSIONS.SPACE_SETTINGS_WRITE)
    );
    expect(owner.current).toBe(true);

    mocks.useCurrentSpace.mockReturnValue({
      space: {
        permissions: SYSTEM_ROLE_PERMISSIONS.Member,
      },
    });
    const { result: member } = renderHook(() =>
      useCan(PERMISSIONS.SPACE_SETTINGS_WRITE)
    );
    expect(member.current).toBe(false);
  });
});
