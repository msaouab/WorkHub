import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { SpaceAccess } from '@work-hub/access';
import {
  ErrorCode,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
} from '@work-hub/constants';
import type { PrismaService } from '@work-hub/database';
import type { MailService } from '@work-hub/mail';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateInviteToken, hashInviteToken } from './invite-token';
import { InvitesService } from './invites.service';

const spaceId = '01936b3c-0000-7000-8000-0000000000aa';
const userId = '01936b3c-0000-7000-8000-0000000000bb';
const roleId = '01936b3c-0000-7000-8000-0000000000cc';
const inviteId = '01936b3c-0000-7000-8000-0000000000dd';

const access: SpaceAccess = {
  spaceId,
  userId,
  membershipId: '01936b3c-0000-7000-8000-0000000000ee',
  membershipStatus: 'active',
  roleId,
  roleName: SYSTEM_ROLE_NAMES.ADMIN,
  permissions: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.INVITES_WRITE,
    PERMISSIONS.ROLES_WRITE,
  ],
};

const grantableRole = {
  id: roleId,
  name: SYSTEM_ROLE_NAMES.MEMBER,
  permissions: [PERMISSIONS.MEMBERS_READ],
};

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: inviteId,
    spaceId,
    roleId,
    kind: 'link' as const,
    email: null,
    tokenHash: hashInviteToken('sample-token-value-32bytes!!'),
    expiresAt: new Date(Date.now() + 86_400_000),
    maxUses: 10,
    uses: 0,
    revokedAt: null,
    createdAt: new Date('2026-10-17T12:00:00.000Z'),
    role: { id: roleId, name: SYSTEM_ROLE_NAMES.MEMBER },
    creator: { id: userId, name: 'Owner' },
    space: { id: spaceId, name: 'Acme', slug: 'acme' },
    ...overrides,
  };
}

function createService(tx: Record<string, unknown>) {
  const withTenant = vi.fn(
    async (
      _ctx: unknown,
      fn: (client: Record<string, unknown>) => Promise<unknown>
    ) => fn(tx)
  );
  const mail = {
    sendSpaceInvite: vi.fn().mockResolvedValue(true),
  };
  const config = {
    get: (key: string) =>
      key === 'corsOrigins' ? ['http://localhost:3000'] : undefined,
  };
  return {
    service: new InvitesService(
      { withTenant } as unknown as PrismaService,
      mail as unknown as MailService,
      config as unknown as ConfigService
    ),
    withTenant,
    mail,
  };
}

describe('invite-token', () => {
  it('hashes tokens stably and generates opaque values', () => {
    const token = generateInviteToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).not.toBe(token);
  });
});

describe('InvitesService.preview', () => {
  it('returns preview for an open invite', async () => {
    const row = inviteRow();
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(row),
      },
    });

    await expect(
      service.preview('sample-token-value-32bytes!!')
    ).resolves.toEqual({
      spaceName: 'Acme',
      spaceSlug: 'acme',
      roleName: SYSTEM_ROLE_NAMES.MEMBER,
      kind: 'link',
      email: null,
      expiresAt: row.expiresAt.toISOString(),
    });
  });

  it('maps revoked / expired / exhausted to Gone with stable codes', async () => {
    const cases = [
      {
        row: inviteRow({ revokedAt: new Date() }),
        code: ErrorCode.INVITE_REVOKED,
      },
      {
        row: inviteRow({ expiresAt: new Date(Date.now() - 1000) }),
        code: ErrorCode.INVITE_EXPIRED,
      },
      {
        row: inviteRow({ uses: 10, maxUses: 10 }),
        code: ErrorCode.INVITE_EXHAUSTED,
      },
    ] as const;

    for (const { row, code } of cases) {
      const { service } = createService({
        invite: { findFirst: vi.fn().mockResolvedValue(row) },
      });
      await expect(
        service.preview('sample-token-value-32bytes!!')
      ).rejects.toMatchObject({
        response: { code },
      });
      await expect(
        service.preview('sample-token-value-32bytes!!')
      ).rejects.toBeInstanceOf(GoneException);
    }
  });
});

describe('InvitesService.accept', () => {
  it('rejects email mismatch', async () => {
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(
          inviteRow({
            kind: 'email',
            email: 'mia@workhub.test',
            maxUses: 1,
          })
        ),
      },
      membership: { findFirst: vi.fn(), create: vi.fn() },
    });

    await expect(
      service.accept('sample-token-value-32bytes!!', userId, 'other@workhub.test')
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.accept('sample-token-value-32bytes!!', userId, 'other@workhub.test')
    ).rejects.toMatchObject({
      response: { code: ErrorCode.INVITE_EMAIL_MISMATCH },
    });
  });

  it('rejects when already a member', async () => {
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(inviteRow()),
        update: vi.fn(),
      },
      membership: {
        findFirst: vi.fn().mockResolvedValue({ id: 'm1' }),
        create: vi.fn(),
      },
    });

    await expect(
      service.accept('sample-token-value-32bytes!!', userId, 'a@test.local')
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('claims a use then creates membership', async () => {
    const create = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(inviteRow()),
        updateMany,
      },
      membership: {
        findFirst: vi.fn().mockResolvedValue(null),
        create,
      },
    });

    await expect(
      service.accept('sample-token-value-32bytes!!', userId, 'a@test.local')
    ).resolves.toEqual({
      spaceId,
      spaceSlug: 'acme',
      spaceName: 'Acme',
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: inviteId,
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
        uses: { lt: 10 },
      },
      data: { uses: { increment: 1 } },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        spaceId,
        userId,
        roleId,
        status: 'active',
      },
    });
  });

  it('rejects when the atomic claim loses the race', async () => {
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(inviteRow({ maxUses: 1, uses: 0 })),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      membership: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    });

    await expect(
      service.accept('sample-token-value-32bytes!!', userId, 'a@test.local')
    ).rejects.toMatchObject({
      response: { code: ErrorCode.INVITE_EXHAUSTED },
    });
  });
});

describe('InvitesService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a link invite and returns the one-time url', async () => {
    const created = inviteRow({ kind: 'link', email: null });
    const { service, mail } = createService({
      space: {
        findFirstOrThrow: vi.fn().mockResolvedValue({ defaultRoleId: roleId }),
      },
      invite: {
        create: vi.fn().mockResolvedValue(created),
        findFirst: vi.fn(),
      },
      membership: { findFirst: vi.fn() },
      role: { findFirst: vi.fn().mockResolvedValue(grantableRole) },
    });

    const result = await service.create(access, {
      kind: 'link',
      maxUses: 5,
      expiresInDays: 3,
    });

    expect(result).toMatchObject({
      url: expect.stringMatching(/^http:\/\/localhost:3000\/invite\//),
    });
    expect('token' in result && result.token).toBeTruthy();
    expect(mail.sendSpaceInvite).not.toHaveBeenCalled();
  });

  it('rejects inviting into a role above the actor', async () => {
    const elevatedRoleId = '01936b3c-0000-7000-8000-0000000000ef';
    const { service } = createService({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: elevatedRoleId,
          name: 'Co-owner',
          permissions: [PERMISSIONS.SPACE_DELETE],
        }),
      },
    });

    await expect(
      service.create(access, {
        kind: 'link',
        roleId: elevatedRoleId,
        maxUses: 5,
        expiresInDays: 3,
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });

  it('returns per-address bulk results for email invites', async () => {
    const created = inviteRow({
      kind: 'email',
      email: 'mia@workhub.test',
      maxUses: 1,
    });
    const { service, mail } = createService({
      space: {
        findFirstOrThrow: vi
          .fn()
          .mockResolvedValueOnce({ defaultRoleId: roleId })
          .mockResolvedValueOnce({
            id: spaceId,
            name: 'Acme',
            slug: 'acme',
          }),
      },
      invite: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue(created),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      membership: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'm1' }),
      },
      role: { findFirst: vi.fn().mockResolvedValue(grantableRole) },
    });

    const result = await service.create(access, {
      kind: 'email',
      emails: ['mia@workhub.test', 'bob@workhub.test'],
      maxUses: 1,
      expiresInDays: 7,
    });

    expect(result).toEqual({
      results: [
        expect.objectContaining({
          email: 'mia@workhub.test',
          status: 'created',
        }),
        expect.objectContaining({
          email: 'bob@workhub.test',
          status: 'already_member',
        }),
      ],
    });
    expect(mail.sendSpaceInvite).toHaveBeenCalledTimes(1);
  });

  it('rejects email invites when the daily workspace cap would be exceeded', async () => {
    const { service } = createService({
      invite: { count: vi.fn().mockResolvedValue(500) },
      space: {
        findFirstOrThrow: vi.fn().mockResolvedValue({ defaultRoleId: roleId }),
      },
    });

    await expect(
      service.create(access, {
        kind: 'email',
        emails: ['mia@workhub.test'],
        maxUses: 1,
        expiresInDays: 7,
      })
    ).rejects.toMatchObject({
      status: 429,
      response: { code: ErrorCode.RATE_LIMITED },
    });
  });
});

describe('InvitesService.resend', () => {
  it('revokes the old invite and creates a fresh email invite', async () => {
    const existing = inviteRow({
      kind: 'email',
      email: 'mia@workhub.test',
      maxUses: 1,
      revokedAt: null,
    });
    const fresh = inviteRow({
      id: '01936b3c-0000-7000-8000-0000000000ff',
      kind: 'email',
      email: 'mia@workhub.test',
      maxUses: 1,
    });
    const update = vi.fn().mockResolvedValue({ ...existing, revokedAt: new Date() });
    const create = vi.fn().mockResolvedValue(fresh);
    const { service, mail } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(existing),
        count: vi.fn().mockResolvedValue(0),
        update,
        create,
      },
      space: {
        findFirstOrThrow: vi.fn().mockResolvedValue({ name: 'Acme' }),
      },
      role: { findFirst: vi.fn().mockResolvedValue(grantableRole) },
    });

    const result = await service.resend(access, inviteId);
    expect(result.id).toBe(fresh.id);
    expect(update).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    expect(mail.sendSpaceInvite).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'mia@workhub.test' })
    );
  });

  it('rejects resend when the invite role is above the actor', async () => {
    const existing = inviteRow({
      kind: 'email',
      email: 'mia@workhub.test',
      maxUses: 1,
      revokedAt: null,
    });
    const { service } = createService({
      invite: {
        findFirst: vi.fn().mockResolvedValue(existing),
      },
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: roleId,
          name: 'Co-owner',
          permissions: [PERMISSIONS.SPACE_DELETE],
        }),
      },
    });

    await expect(service.resend(access, inviteId)).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });
});

describe('InvitesService.revoke', () => {
  it('404s for unknown ids', async () => {
    const { service } = createService({
      invite: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.revoke(access, inviteId)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
