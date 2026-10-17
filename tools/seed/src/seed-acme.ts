import { defaultCoverPreset, SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { uuidv7, type PrismaClient } from '@work-hub/database';
import { systemRolesFor } from '@work-hub/spaces/system-roles';

export const ACME_SLUG = 'acme';
export const ACME_NAME = 'Acme';

const OWNER_EMAIL = 'owner@workhub.test';
const ADMIN_EMAIL = 'admin@workhub.test';
const MEMBER_EMAIL = 'member@workhub.test';

export type AcmeSeedResult = {
  slug: string;
  status: 'created' | 'exists';
  spaceId: string;
};

/**
 * Ensures the Acme workspace exists with owner / admin / member memberships.
 * Uses the migration owner URL (no RLS). Safe to run twice.
 */
export async function seedAcmeSpace(
  prisma: PrismaClient
): Promise<AcmeSeedResult> {
  const [owner, admin, member] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: OWNER_EMAIL } }),
    prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } }),
    prisma.user.findUniqueOrThrow({ where: { email: MEMBER_EMAIL } }),
  ]);

  const existing = await prisma.space.findUnique({
    where: { slug: ACME_SLUG },
    include: { roles: true },
  });

  if (existing) {
    await syncSystemRolePermissions(prisma, existing.id, existing.roles);
    const roles = await prisma.role.findMany({
      where: { spaceId: existing.id },
    });
    const memberRole = roles.find((r) => r.name === SYSTEM_ROLE_NAMES.MEMBER);
    const needsDefaultRole =
      memberRole && existing.defaultRoleId !== memberRole.id;
    const needsCover =
      existing.coverKey == null && existing.coverPreset == null;
    if (needsDefaultRole || needsCover) {
      await prisma.space.update({
        where: { id: existing.id },
        data: {
          ...(needsDefaultRole && memberRole
            ? { defaultRoleId: memberRole.id }
            : {}),
          ...(needsCover
            ? { coverPreset: defaultCoverPreset(existing.id) }
            : {}),
        },
      });
    }
    await ensureAcmeMemberships(prisma, existing.id, {
      ownerId: owner.id,
      adminId: admin.id,
      memberId: member.id,
      roles,
    });
    return { slug: ACME_SLUG, status: 'exists', spaceId: existing.id };
  }

  const spaceId = uuidv7();
  const { roles, defaultRoleId, roleIds } = systemRolesFor(spaceId);

  await prisma.$transaction(async (tx) => {
    await tx.space.create({
      data: {
        id: spaceId,
        name: ACME_NAME,
        slug: ACME_SLUG,
        coverPreset: defaultCoverPreset(spaceId),
        roles: {
          create: roles.map(({ id, name, permissions, isSystem }) => ({
            id,
            name,
            permissions,
            isSystem,
          })),
        },
      },
    });

    await tx.space.update({
      where: { id: spaceId },
      data: { defaultRoleId },
    });

    await tx.membership.createMany({
      data: [
        {
          id: uuidv7(),
          spaceId,
          userId: owner.id,
          roleId: roleIds[SYSTEM_ROLE_NAMES.OWNER],
          status: 'active',
        },
        {
          id: uuidv7(),
          spaceId,
          userId: admin.id,
          roleId: roleIds[SYSTEM_ROLE_NAMES.ADMIN],
          status: 'active',
        },
        {
          id: uuidv7(),
          spaceId,
          userId: member.id,
          roleId: roleIds[SYSTEM_ROLE_NAMES.MEMBER],
          status: 'active',
        },
      ],
    });
  });

  return { slug: ACME_SLUG, status: 'created', spaceId };
}

/** Deletes only the Acme workspace (roles/memberships cascade). */
export async function deleteAcmeSpace(prisma: PrismaClient): Promise<number> {
  // Clear defaultRoleId first — Space → Role is Restrict, not Cascade.
  await prisma.space.updateMany({
    where: { slug: ACME_SLUG },
    data: { defaultRoleId: null },
  });
  const { count } = await prisma.space.deleteMany({
    where: { slug: ACME_SLUG },
  });
  return count;
}

async function syncSystemRolePermissions(
  prisma: PrismaClient,
  spaceId: string,
  roles: Array<{ id: string; name: string }>
): Promise<void> {
  const { roles: catalog } = systemRolesFor(spaceId);
  for (const catalogRole of catalog) {
    const existing = roles.find((r) => r.name === catalogRole.name);
    if (!existing) {
      await prisma.role.create({
        data: {
          id: catalogRole.id,
          spaceId,
          name: catalogRole.name,
          permissions: catalogRole.permissions,
          isSystem: true,
        },
      });
      continue;
    }
    await prisma.role.update({
      where: { id: existing.id },
      data: { permissions: catalogRole.permissions, isSystem: true },
    });
  }
}

async function ensureAcmeMemberships(
  prisma: PrismaClient,
  spaceId: string,
  opts: {
    ownerId: string;
    adminId: string;
    memberId: string;
    roles: Array<{ id: string; name: string }>;
  }
): Promise<void> {
  const byName = Object.fromEntries(opts.roles.map((r) => [r.name, r.id]));
  const desired = [
    {
      userId: opts.ownerId,
      roleId: byName[SYSTEM_ROLE_NAMES.OWNER],
    },
    {
      userId: opts.adminId,
      roleId: byName[SYSTEM_ROLE_NAMES.ADMIN],
    },
    {
      userId: opts.memberId,
      roleId: byName[SYSTEM_ROLE_NAMES.MEMBER],
    },
  ] as const;

  for (const row of desired) {
    if (!row.roleId) {
      throw new Error(`Acme space ${spaceId} is missing a system role`);
    }
    await prisma.membership.upsert({
      where: {
        spaceId_userId: { spaceId, userId: row.userId },
      },
      create: {
        id: uuidv7(),
        spaceId,
        userId: row.userId,
        roleId: row.roleId,
        status: 'active',
      },
      update: {
        roleId: row.roleId,
        status: 'active',
      },
    });
  }
}
