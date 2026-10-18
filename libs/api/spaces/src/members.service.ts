import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SpaceAccess } from '@work-hub/access';
import {
  ErrorCode,
  PERMISSION_LIST,
  SYSTEM_ROLE_NAMES,
  permissionsAreSubset,
  type Permission,
} from '@work-hub/constants';
import type {
  ListSpaceMembersQuery,
  ListSpaceMembersResponse,
  SpaceMember,
} from '@work-hub/contracts';
import { Prisma, PrismaService } from '@work-hub/database';

const PERMISSION_CATALOG = new Set<string>(PERMISSION_LIST);

type MembershipWithUserRole = {
  id: string;
  userId: string;
  status: 'active' | 'deactivated';
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
};

/** Membership list + deactivate / reactivate / remove / leave (WH-046). */
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    access: SpaceAccess,
    query: ListSpaceMembersQuery
  ): Promise<ListSpaceMembersResponse> {
    if (query.cursor && !isUuid(query.cursor)) {
      throw new BadRequestException('Invalid cursor');
    }

    const limit = query.limit;
    const q = query.q ? escapeIlikePattern(query.q) : undefined;

    const rows = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      (tx) =>
        tx.membership.findMany({
          where: {
            spaceId: access.spaceId,
            ...(query.cursor ? { id: { gt: query.cursor } } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.role
              ? { role: { name: { equals: query.role, mode: 'insensitive' } } }
              : {}),
            ...(q
              ? {
                  OR: [
                    {
                      user: {
                        name: { contains: q, mode: 'insensitive' },
                      },
                    },
                    {
                      user: {
                        email: { contains: q, mode: 'insensitive' },
                      },
                    },
                  ],
                }
              : {}),
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            role: { select: { id: true, name: true, permissions: true } },
          },
          orderBy: { id: 'asc' },
          take: limit + 1,
        })
    );

    const page = rows.slice(0, limit);
    const nextCursor =
      rows.length > limit ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((row) => this.toMember(row)),
      nextCursor,
    };
  }

  async deactivate(
    access: SpaceAccess,
    membershipId: string
  ): Promise<SpaceMember> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const target = await this.requireMembership(tx, access.spaceId, membershipId);

        if (target.role.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'Owners cannot be deactivated',
            code: ErrorCode.CANNOT_MODIFY_OWNER,
          });
        }
        if (target.userId === access.userId) {
          throw new ForbiddenException({
            message: 'You cannot deactivate yourself',
            code: ErrorCode.CANNOT_DEACTIVATE_SELF,
          });
        }
        this.assertRoleWithinReach(target.role.permissions, access.permissions);

        if (target.status === 'deactivated') {
          return this.toMember(target);
        }

        const updated = await tx.membership.update({
          where: { id: target.id },
          data: { status: 'deactivated' },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
        return this.toMember(updated);
      }
    );
  }

  async reactivate(
    access: SpaceAccess,
    membershipId: string
  ): Promise<SpaceMember> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const target = await this.requireMembership(tx, access.spaceId, membershipId);

        if (target.role.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'Owners cannot be modified this way',
            code: ErrorCode.CANNOT_MODIFY_OWNER,
          });
        }
        this.assertRoleWithinReach(target.role.permissions, access.permissions);

        if (target.status === 'active') {
          return this.toMember(target);
        }

        const updated = await tx.membership.update({
          where: { id: target.id },
          data: { status: 'active' },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
        return this.toMember(updated);
      }
    );
  }

  async remove(access: SpaceAccess, membershipId: string): Promise<void> {
    await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const target = await this.requireMembership(tx, access.spaceId, membershipId);

        if (target.role.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'Owners cannot be removed',
            code: ErrorCode.CANNOT_MODIFY_OWNER,
          });
        }
        if (target.userId === access.userId) {
          throw new ForbiddenException({
            message: 'Use leave to remove yourself from the workspace',
            code: ErrorCode.CANNOT_REMOVE_SELF,
          });
        }
        this.assertRoleWithinReach(target.role.permissions, access.permissions);

        await tx.membership.delete({ where: { id: target.id } });
      }
    );
  }

  async leave(access: SpaceAccess): Promise<void> {
    await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        if (access.roleName === SYSTEM_ROLE_NAMES.OWNER) {
          const ownerCount = await tx.membership.count({
            where: {
              spaceId: access.spaceId,
              role: { name: SYSTEM_ROLE_NAMES.OWNER },
            },
          });
          if (ownerCount <= 1) {
            throw new ForbiddenException({
              message:
                'Transfer ownership before leaving as the last owner',
              code: ErrorCode.LAST_OWNER,
            });
          }
        }

        await tx.membership.delete({
          where: { id: access.membershipId },
        });
      }
    );
  }

  /**
   * Change a member's role (WH-011). Caller must have `roles.write`.
   * No self-change, Owner role untouchable, no escalation beyond actor perms.
   */
  async updateRole(
    access: SpaceAccess,
    membershipId: string,
    roleId: string
  ): Promise<SpaceMember> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const target = await this.requireMembership(
          tx,
          access.spaceId,
          membershipId
        );

        if (target.userId === access.userId) {
          throw new ForbiddenException({
            message: 'You cannot change your own role',
            code: ErrorCode.CANNOT_CHANGE_OWN_ROLE,
          });
        }
        if (target.role.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'The Owner role cannot be changed',
            code: ErrorCode.CANNOT_MODIFY_OWNER,
          });
        }
        this.assertRoleWithinReach(target.role.permissions, access.permissions);
        if (!isUuid(roleId)) {
          throw new NotFoundException('Role not found');
        }

        const nextRole = await tx.role.findFirst({
          where: { id: roleId, spaceId: access.spaceId },
          select: { id: true, name: true, permissions: true },
        });
        if (!nextRole) {
          throw new NotFoundException('Role not found');
        }
        if (nextRole.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'Use ownership transfer to make someone Owner',
            code: ErrorCode.CANNOT_ASSIGN_OWNER,
          });
        }
        this.assertRoleWithinReach(nextRole.permissions, access.permissions);

        if (target.role.id === nextRole.id) {
          return this.toMember(target);
        }

        const updated = await tx.membership.update({
          where: { id: target.id },
          data: { roleId: nextRole.id },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
        return this.toMember(updated);
      }
    );
  }

  private async requireMembership(
    tx: Prisma.TransactionClient,
    spaceId: string,
    membershipId: string
  ): Promise<MembershipWithUserRole> {
    if (!isUuid(membershipId)) {
      throw new NotFoundException('Member not found');
    }

    const row = await tx.membership.findFirst({
      where: { id: membershipId, spaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        role: { select: { id: true, name: true, permissions: true } },
      },
    });

    if (!row) {
      throw new NotFoundException('Member not found');
    }
    return row;
  }

  /** Actor may only manage members whose current role is ⊆ actor permissions. */
  private assertRoleWithinReach(
    rolePermissions: readonly string[],
    actorPermissions: readonly string[]
  ): void {
    if (!permissionsAreSubset(rolePermissions, actorPermissions)) {
      throw new ForbiddenException({
        message: 'You cannot manage a role with permissions you do not have',
        code: ErrorCode.ROLE_ESCALATION,
      });
    }
  }

  private toMember(row: MembershipWithUserRole): SpaceMember {
    return {
      id: row.id,
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      image: row.user.image,
      role: {
        id: row.role.id,
        name: row.role.name,
        permissions: catalogPermissions(row.role.permissions),
      },
      membershipStatus: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

/** Drop unknown DB strings so the response matches the Permission catalog. */
function catalogPermissions(values: readonly string[]): Permission[] {
  return values.filter((value): value is Permission =>
    PERMISSION_CATALOG.has(value)
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Escape `\`, `%`, `_` so Prisma `contains` / Postgres ILIKE treats them literally. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
