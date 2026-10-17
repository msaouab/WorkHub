import { ConfigModule } from '@nestjs/config';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { SpaceGuard } from '@work-hub/access';
import { DatabaseModule, PrismaService } from '@work-hub/database';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SpacesService } from './spaces.service';

const serverRoot = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverRoot, '.env.local'), resolve(serverRoot, '.env')],
  quiet: true,
});

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('SpacesService + SpaceGuard (DB)', () => {
  let prisma: PrismaService;
  let spaces: SpacesService;
  let guard: SpaceGuard;

  const userA = randomUUID();
  const userB = randomUUID();
  let spaceAId = '';
  let spaceBId = '';
  const slugA = `it-a-${Date.now().toString(36)}`;
  const slugB = `it-b-${Date.now().toString(36)}`;

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
            }),
          ],
        }),
        DatabaseModule,
      ],
      providers: [SpacesService, SpaceGuard],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    spaces = moduleRef.get(SpacesService);
    guard = moduleRef.get(SpaceGuard);
    await prisma.$connect();

    await prisma.user.createMany({
      data: [
        {
          id: userA,
          name: 'Space IT A',
          email: `space-it-a-${userA}@workhub.test`,
          emailVerified: true,
        },
        {
          id: userB,
          name: 'Space IT B',
          email: `space-it-b-${userB}@workhub.test`,
          emailVerified: true,
        },
      ],
    });

    spaceAId = (
      await spaces.create(userA, { name: 'Space A', slug: slugA })
    ).id;
    spaceBId = (
      await spaces.create(userB, { name: 'Space B', slug: slugB })
    ).id;
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    for (const [userId, spaceId] of [
      [userA, spaceAId],
      [userB, spaceBId],
    ] as const) {
      if (!spaceId) {
        continue;
      }
      await prisma
        .withTenant({ userId, spaceId }, (tx) =>
          tx.space.delete({ where: { id: spaceId } })
        )
        .catch(() => undefined);
    }
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
    await prisma.$disconnect();
  });

  it('makes the creator Owner and lists the space', async () => {
    const created = await spaces.create(userA, {
      name: 'Extra',
      slug: `it-extra-${Date.now().toString(36)}`,
    });
    expect(created.role.name).toBe(SYSTEM_ROLE_NAMES.OWNER);

    const mine = await spaces.listMine(userA);
    expect(
      mine.some((s) => s.id === created.id && s.roleName === 'Owner')
    ).toBe(true);

    await prisma.withTenant({ userId: userA, spaceId: created.id }, (tx) =>
      tx.space.delete({ where: { id: created.id } })
    );
  });

  it('rejects a duplicate slug with 409', async () => {
    await expect(
      spaces.create(userB, { name: 'Dup', slug: slugA })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('hides workspace B from user A (404) and allows user B', async () => {
    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { spaceId: spaceBId },
            user: { id: userA },
          }),
        }),
      } as never)
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { spaceId: spaceBId },
            user: { id: userB },
          }),
        }),
      } as never)
    ).resolves.toBe(true);
  });

  it('forbids a deactivated membership', async () => {
    await prisma.withTenant({ userId: userB, spaceId: spaceBId }, (tx) =>
      tx.membership.update({
        where: { spaceId_userId: { spaceId: spaceBId, userId: userB } },
        data: { status: 'deactivated' },
      })
    );

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { spaceId: spaceBId },
            user: { id: userB },
          }),
        }),
      } as never)
    ).rejects.toBeInstanceOf(ForbiddenException);

    await prisma.withTenant({ userId: userB, spaceId: spaceBId }, (tx) =>
      tx.membership.update({
        where: { spaceId_userId: { spaceId: spaceBId, userId: userB } },
        data: { status: 'active' },
      })
    );
  });

  it('does not list workspace B for user A', async () => {
    const mine = await spaces.listMine(userA);
    expect(mine.map((s) => s.id)).toContain(spaceAId);
    expect(mine.map((s) => s.id)).not.toContain(spaceBId);
  });
});
