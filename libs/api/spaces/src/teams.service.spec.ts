import { BadRequestException, ConflictException } from '@nestjs/common';
import { ErrorCode, PERMISSIONS, SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { Prisma, type PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { TeamsService } from './teams.service';

const spaceId = '01936b3c-0000-7000-8000-0000000000aa';
const actorId = '01936b3c-0000-7000-8000-0000000000bb';
const teamId = '01936b3c-0000-7000-8000-0000000000t1';
const membershipId = '01936b3c-0000-7000-8000-0000000000m1';
const userId = '01936b3c-0000-7000-8000-0000000000u1';

const access = {
  spaceId,
  userId: actorId,
  membershipId: '01936b3c-0000-7000-8000-0000000000ff',
  membershipStatus: 'active' as const,
  roleId: '01936b3c-0000-7000-8000-0000000000a1',
  roleName: SYSTEM_ROLE_NAMES.ADMIN,
  permissions: [PERMISSIONS.TEAMS_WRITE, PERMISSIONS.MEMBERS_READ],
};

function mockPrisma(tx: Record<string, unknown>) {
  const withTenant = vi.fn(
    async (
      _ctx: unknown,
      fn: (client: Record<string, unknown>) => Promise<unknown>
    ) => fn(tx)
  );
  return { prisma: { withTenant } as unknown as PrismaService, withTenant };
}

const personMembership = {
  id: membershipId,
  userId,
  user: {
    id: userId,
    name: 'Ada',
    email: 'ada@workhub.test',
    image: null,
  },
};

describe('TeamsService', () => {
  it('lists teams with members and managers', async () => {
    const { prisma } = mockPrisma({
      team: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: teamId,
            name: 'Engineering',
            createdAt: new Date('2026-10-18T12:00:00.000Z'),
            members: [{ membership: personMembership }],
            managers: [{ membership: personMembership }],
          },
        ]),
      },
    });
    const service = new TeamsService(prisma);

    await expect(service.list(access)).resolves.toEqual({
      items: [
        {
          id: teamId,
          name: 'Engineering',
          createdAt: '2026-10-18T12:00:00.000Z',
          members: [
            {
              membershipId,
              userId,
              name: 'Ada',
              email: 'ada@workhub.test',
              image: null,
            },
          ],
          managers: [
            {
              membershipId,
              userId,
              name: 'Ada',
              email: 'ada@workhub.test',
              image: null,
            },
          ],
        },
      ],
    });
  });

  it('rejects memberships that are not active in the space', async () => {
    const { prisma } = mockPrisma({
      membership: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      team: {
        create: vi.fn(),
      },
    });
    const service = new TeamsService(prisma);

    await expect(
      service.create(access, {
        name: 'Ops',
        memberIds: [membershipId],
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.create(access, {
        name: 'Ops',
        memberIds: [membershipId],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.MEMBERSHIP_NOT_IN_SPACE },
    });
  });

  it('rejects managers whose role lacks leave.approve', async () => {
    const { prisma } = mockPrisma({
      membership: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: membershipId }])
          .mockResolvedValueOnce([
            {
              id: membershipId,
              role: { permissions: [PERMISSIONS.MEMBERS_READ] },
            },
          ]),
      },
      team: {
        create: vi.fn(),
      },
    });
    const service = new TeamsService(prisma);

    await expect(
      service.create(access, {
        name: 'Ops',
        managerIds: [membershipId],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_FAILED },
    });
  });

  it('maps unique name conflicts to TEAM_NAME_TAKEN', async () => {
    const { prisma } = mockPrisma({
      membership: {
        findMany: vi.fn().mockResolvedValue([{ id: membershipId }]),
      },
      team: {
        create: vi.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('dup', {
            code: 'P2002',
            clientVersion: 'test',
          })
        ),
      },
    });
    const service = new TeamsService(prisma);

    await expect(
      service.create(access, {
        name: 'Engineering',
        memberIds: [membershipId],
      })
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.create(access, {
        name: 'Engineering',
        memberIds: [membershipId],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.TEAM_NAME_TAKEN },
    });
  });
});
