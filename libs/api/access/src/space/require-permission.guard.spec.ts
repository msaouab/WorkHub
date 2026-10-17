import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS } from '@work-hub/constants';
import { describe, expect, it, vi } from 'vitest';
import { RequirePermissionGuard } from './require-permission.guard';
import { SPACE_ACCESS_KEY } from './space.types';

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('RequirePermissionGuard', () => {
  it('allows when no permission metadata is set', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RequirePermissionGuard(reflector);

    expect(guard.canActivate(makeContext({}))).toBe(true);
  });

  it('allows when the loaded role has the permission', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(PERMISSIONS.MEMBERS_READ),
    } as unknown as Reflector;
    const guard = new RequirePermissionGuard(reflector);

    expect(
      guard.canActivate(
        makeContext({
          [SPACE_ACCESS_KEY]: {
            permissions: [PERMISSIONS.MEMBERS_READ],
          },
        })
      )
    ).toBe(true);
  });

  it('forbids when the permission is missing', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(PERMISSIONS.SPACE_DELETE),
    } as unknown as Reflector;
    const guard = new RequirePermissionGuard(reflector);

    expect(() =>
      guard.canActivate(
        makeContext({
          [SPACE_ACCESS_KEY]: {
            permissions: [PERMISSIONS.MEMBERS_READ],
          },
        })
      )
    ).toThrow(ForbiddenException);
  });
});
