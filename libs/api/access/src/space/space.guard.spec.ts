import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { PERMISSIONS, SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import type { PrismaService } from '@work-hub/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SPACE_ACCESS_KEY } from './space.types';
import { SpaceGuard } from './space.guard';

const SPACE_A = '01936b3c-0000-7000-8000-0000000000aa';
const USER_A = '01936b3c-0000-7000-8000-0000000000a1';
const USER_B = '01936b3c-0000-7000-8000-0000000000b1';

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('SpaceGuard', () => {
  const withTenant = vi.fn();
  const prisma = { withTenant } as unknown as PrismaService;
  const guard = new SpaceGuard(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when there is no signed-in user', async () => {
    await expect(
      guard.canActivate(
        makeContext({ params: { spaceId: SPACE_A }, user: null })
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('answers 404 when spaceId is not a UUID', async () => {
    await expect(
      guard.canActivate(
        makeContext({
          params: { spaceId: 'not-a-uuid' },
          user: { id: USER_A },
        })
      )
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(withTenant).not.toHaveBeenCalled();
  });

  it('answers 404 when the user is not a member', async () => {
    withTenant.mockImplementation(async (_ctx, fn) =>
      fn({ membership: { findUnique: vi.fn().mockResolvedValue(null) } })
    );

    await expect(
      guard.canActivate(
        makeContext({
          params: { spaceId: SPACE_A },
          user: { id: USER_B },
        })
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('answers 403 when membership is deactivated', async () => {
    withTenant.mockImplementation(async (_ctx, fn) =>
      fn({
        membership: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'm1',
            status: 'deactivated',
            role: {
              id: 'r1',
              name: SYSTEM_ROLE_NAMES.MEMBER,
              permissions: [PERMISSIONS.MEMBERS_READ],
            },
          }),
        },
      })
    );

    await expect(
      guard.canActivate(
        makeContext({
          params: { spaceId: SPACE_A },
          user: { id: USER_A },
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loads the role per request and attaches SpaceAccess', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      status: 'active',
      role: {
        id: 'r1',
        name: SYSTEM_ROLE_NAMES.OWNER,
        permissions: [PERMISSIONS.SPACE_DELETE],
      },
    });
    withTenant.mockImplementation(async (_ctx, fn) =>
      fn({ membership: { findUnique } })
    );

    const request: Record<string, unknown> = {
      params: { spaceId: SPACE_A },
      user: { id: USER_A },
    };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(withTenant).toHaveBeenCalledWith(
      { userId: USER_A },
      expect.any(Function)
    );
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        spaceId_userId: { spaceId: SPACE_A, userId: USER_A },
      },
      include: { role: true },
    });
    expect(request[SPACE_ACCESS_KEY]).toEqual({
      spaceId: SPACE_A,
      userId: USER_A,
      membershipId: 'm1',
      membershipStatus: 'active',
      roleId: 'r1',
      roleName: SYSTEM_ROLE_NAMES.OWNER,
      permissions: [PERMISSIONS.SPACE_DELETE],
    });
  });
});
