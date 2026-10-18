import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  RequirePermissionGuard,
  SPACE_ACCESS_KEY,
  SpaceGuard,
  type SpaceAccess,
} from '@work-hub/access';
import {
  ErrorCode,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
} from '@work-hub/constants';
import { DatabaseModule, PrismaService } from '@work-hub/database';
import { MailService } from '@work-hub/mail';
import { StorageModule } from '@work-hub/storage';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { InvitesService } from './invites.service';
import { SpacesService } from './spaces.service';

const serverRoot = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverRoot, '.env.local'), resolve(serverRoot, '.env')],
  quiet: true,
});

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('InvitesService (DB)', () => {
  let prisma: PrismaService;
  let spaces: SpacesService;
  let invites: InvitesService;
  let spaceGuard: SpaceGuard;

  const ownerId = randomUUID();
  const joinerId = randomUUID();
  const outsiderId = randomUUID();
  let spaceId = '';
  const slug = `inv-${Date.now().toString(36)}`;
  let linkToken = '';

  async function loadAccess(
    sid: string,
    userId: string
  ): Promise<SpaceAccess> {
    const request: Record<string, unknown> = {
      params: { spaceId: sid },
      user: { id: userId },
    };
    await spaceGuard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);
    return request[SPACE_ACCESS_KEY] as SpaceAccess;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              databaseUrl: process.env.DATABASE_URL,
              corsOrigins: ['http://localhost:3000'],
              storage: {
                endpoint:
                  process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
                region: process.env.STORAGE_REGION ?? 'us-east-1',
                bucket: process.env.STORAGE_BUCKET ?? 'workhub',
                accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'workhub',
                secretAccessKey:
                  process.env.STORAGE_SECRET_KEY ?? 'workhubsecret',
                publicBaseUrl:
                  process.env.STORAGE_PUBLIC_BASE_URL ??
                  'http://localhost:9000/workhub',
                forcePathStyle: true,
              },
            }),
          ],
        }),
        DatabaseModule,
        StorageModule,
      ],
      providers: [
        SpacesService,
        InvitesService,
        SpaceGuard,
        Reflector,
        {
          provide: MailService,
          useValue: {
            sendSpaceInvite: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    spaces = moduleRef.get(SpacesService);
    invites = moduleRef.get(InvitesService);
    spaceGuard = moduleRef.get(SpaceGuard);

    await prisma.user.create({
      data: {
        id: ownerId,
        name: 'Invite Owner',
        email: `owner-${ownerId}@workhub.test`,
        emailVerified: true,
      },
    });
    await prisma.user.create({
      data: {
        id: joinerId,
        name: 'Invite Joiner',
        email: `joiner-${joinerId}@workhub.test`,
        emailVerified: true,
      },
    });
    await prisma.user.create({
      data: {
        id: outsiderId,
        name: 'Invite Outsider',
        email: `out-${outsiderId}@workhub.test`,
        emailVerified: true,
      },
    });

    const space = await spaces.create(ownerId, {
      name: 'Invite Space',
      slug,
    });
    spaceId = space.id;

    const access = await loadAccess(spaceId, ownerId);
    const created = await invites.create(access, {
      kind: 'link',
      maxUses: 2,
      expiresInDays: 7,
    });
    if (!('token' in created) || !created.token) {
      throw new Error('expected link invite to return a one-time token');
    }
    linkToken = created.token;
  }, 60_000);

  afterAll(async () => {
    if (spaceId) {
      await prisma.withTenant({ userId: ownerId, spaceId }, (tx) =>
        tx.space.delete({ where: { id: spaceId } })
      );
    }
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, joinerId, outsiderId] } },
    });
    await prisma.$disconnect();
  });

  it('lists invites for the owner and forbids a non-member via SpaceGuard', async () => {
    const access = await loadAccess(spaceId, ownerId);
    const page = await invites.list(access, { limit: 20, status: 'pending' });
    expect(page.items.length).toBeGreaterThanOrEqual(1);
    expect(page.items[0]?.kind).toBe('link');
    expect(page.items[0]?.createdBy.id).toBe(ownerId);

    await expect(loadAccess(spaceId, outsiderId)).rejects.toBeTruthy();
  });

  it('previews and accepts a link invite', async () => {
    const preview = await invites.preview(linkToken);
    expect(preview.spaceSlug).toBe(slug);
    expect(preview.roleName).toBe(SYSTEM_ROLE_NAMES.MEMBER);

    const joined = await invites.accept(
      linkToken,
      joinerId,
      `joiner-${joinerId}@workhub.test`
    );
    expect(joined.spaceId).toBe(spaceId);

    await expect(
      invites.accept(linkToken, joinerId, `joiner-${joinerId}@workhub.test`)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ALREADY_MEMBER },
    });
  });

  it('enforces INVITES_WRITE on the permission guard', async () => {
    const access = await loadAccess(spaceId, ownerId);
    const guard = new RequirePermissionGuard({
      getAllAndOverride: () => PERMISSIONS.INVITES_WRITE,
    } as unknown as Reflector);
    const request = { [SPACE_ACCESS_KEY]: access };
    expect(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as never)
    ).toBe(true);

    const memberAccess: SpaceAccess = {
      ...access,
      roleName: SYSTEM_ROLE_NAMES.MEMBER,
      permissions: [],
    };
    const memberRequest = { [SPACE_ACCESS_KEY]: memberAccess };
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => memberRequest }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as never)
    ).toThrow();
  });

  it('allows only one concurrent accept when maxUses is 1', async () => {
    const access = await loadAccess(spaceId, ownerId);
    const created = await invites.create(access, {
      kind: 'link',
      maxUses: 1,
      expiresInDays: 7,
    });
    if (!('token' in created) || !created.token) {
      throw new Error('expected link invite token');
    }
    const token = created.token;

    const a = randomUUID();
    const b = randomUUID();
    await prisma.user.create({
      data: {
        id: a,
        name: 'Race A',
        email: `race-a-${a}@workhub.test`,
        emailVerified: true,
      },
    });
    await prisma.user.create({
      data: {
        id: b,
        name: 'Race B',
        email: `race-b-${b}@workhub.test`,
        emailVerified: true,
      },
    });

    const results = await Promise.allSettled([
      invites.accept(token, a, `race-a-${a}@workhub.test`),
      invites.accept(token, b, `race-b-${b}@workhub.test`),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(
      (rejected[0] as PromiseRejectedResult).reason?.response?.code
    ).toBe(ErrorCode.INVITE_EXHAUSTED);

    await prisma.withTenant({ userId: ownerId, spaceId }, (tx) =>
      tx.membership.deleteMany({ where: { userId: { in: [a, b] } } })
    );
    await prisma.user.deleteMany({ where: { id: { in: [a, b] } } });
  });
});
