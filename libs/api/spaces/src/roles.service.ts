import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SpaceAccess } from '@work-hub/access';
import {
  ErrorCode,
  MAX_CUSTOM_ROLES,
  SYSTEM_ROLE_NAME_LIST,
  SYSTEM_ROLE_NAMES,
  permissionsAreSubset,
  type Permission,
} from '@work-hub/constants';
import type {
  CreateSpaceRole,
  ListSpaceRolesResponse,
  PatchSpaceRole,
  SpaceRoleOption,
} from '@work-hub/contracts';
import { Prisma, PrismaService } from '@work-hub/database';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

const RESERVED_ROLE_NAMES_LOWER = new Set(
  SYSTEM_ROLE_NAME_LIST.map((name) => name.toLowerCase())
);

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(access: SpaceAccess): Promise<ListSpaceRolesResponse> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const space = await tx.space.findFirstOrThrow({
          where: { id: access.spaceId },
          select: { defaultRoleId: true },
        });
        const rows = await tx.role.findMany({
          where: { spaceId: access.spaceId },
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
            _count: { select: { memberships: true } },
          },
          orderBy: { name: 'asc' },
        });
        return {
          items: rows.map((row) => this.toOption(row, space.defaultRoleId)),
        };
      }
    );
  }

  async create(
    access: SpaceAccess,
    input: CreateSpaceRole
  ): Promise<SpaceRoleOption> {
    this.assertPermissionsSubset(input.permissions, access.permissions);
    this.assertNotReservedName(input.name);

    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        await this.assertUniqueName(tx, access.spaceId, input.name);
        await this.assertCustomRoleLimit(tx, access.spaceId);

        try {
          const created = await tx.role.create({
            data: {
              spaceId: access.spaceId,
              name: input.name,
              permissions: input.permissions,
              isSystem: false,
            },
            select: {
              id: true,
              name: true,
              permissions: true,
              isSystem: true,
              _count: { select: { memberships: true } },
            },
          });

          if (input.isDefault) {
            await tx.space.update({
              where: { id: access.spaceId },
              data: { defaultRoleId: created.id },
            });
          }

          const space = await tx.space.findFirstOrThrow({
            where: { id: access.spaceId },
            select: { defaultRoleId: true },
          });
          return this.toOption(created, space.defaultRoleId);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException('A role with this name already exists');
          }
          throw error;
        }
      }
    );
  }

  async update(
    access: SpaceAccess,
    roleId: string,
    input: PatchSpaceRole
  ): Promise<SpaceRoleOption> {
    if (input.permissions) {
      this.assertPermissionsSubset(input.permissions, access.permissions);
    }

    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const role = await this.requireRole(tx, access.spaceId, roleId);

        if (role.name === SYSTEM_ROLE_NAMES.OWNER) {
          throw new ForbiddenException({
            message: 'The Owner role cannot be modified',
            code: ErrorCode.SYSTEM_ROLE_LOCKED,
          });
        }

        if (role.id === access.roleId) {
          throw new ForbiddenException({
            message: 'You cannot edit the role you hold',
            code: ErrorCode.CANNOT_CHANGE_OWN_ROLE,
          });
        }

        this.assertRoleWithinReach(role.permissions, access.permissions);

        if (role.isSystem && input.name !== undefined) {
          throw new ForbiddenException({
            message: 'System roles cannot be renamed',
            code: ErrorCode.SYSTEM_ROLE_LOCKED,
          });
        }

        if (input.name !== undefined && input.name !== role.name) {
          this.assertNotReservedName(input.name);
          await this.assertUniqueName(tx, access.spaceId, input.name, role.id);
        }

        if (
          input.isDefault === false &&
          (await this.isDefaultRole(tx, access.spaceId, role.id))
        ) {
          throw new ConflictException({
            message: 'Set another role as default before clearing this one',
            code: ErrorCode.CONFLICT,
          });
        }

        try {
          const updated = await tx.role.update({
            where: { id: role.id },
            data: {
              ...(input.name !== undefined ? { name: input.name } : {}),
              ...(input.permissions !== undefined
                ? { permissions: input.permissions }
                : {}),
            },
            select: {
              id: true,
              name: true,
              permissions: true,
              isSystem: true,
              _count: { select: { memberships: true } },
            },
          });

          if (input.isDefault === true) {
            await tx.space.update({
              where: { id: access.spaceId },
              data: { defaultRoleId: updated.id },
            });
          }

          const space = await tx.space.findFirstOrThrow({
            where: { id: access.spaceId },
            select: { defaultRoleId: true },
          });
          return this.toOption(updated, space.defaultRoleId);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException('A role with this name already exists');
          }
          throw error;
        }
      }
    );
  }

  async delete(access: SpaceAccess, roleId: string): Promise<void> {
    await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const role = await this.requireRole(tx, access.spaceId, roleId);

        if (role.isSystem) {
          throw new ForbiddenException({
            message: 'System roles cannot be deleted',
            code: ErrorCode.SYSTEM_ROLE_LOCKED,
          });
        }

        if (role.id === access.roleId) {
          throw new ForbiddenException({
            message: 'You cannot edit the role you hold',
            code: ErrorCode.CANNOT_CHANGE_OWN_ROLE,
          });
        }

        this.assertRoleWithinReach(role.permissions, access.permissions);

        if (await this.isDefaultRole(tx, access.spaceId, role.id)) {
          throw new ConflictException({
            message: 'Set another role as default before deleting this one',
            code: ErrorCode.CONFLICT,
          });
        }

        const [membershipCount, inviteCount] = await Promise.all([
          tx.membership.count({ where: { roleId: role.id } }),
          tx.invite.count({
            where: { roleId: role.id, revokedAt: null },
          }),
        ]);
        if (membershipCount > 0 || inviteCount > 0) {
          throw new ConflictException({
            message: 'Role is assigned to members or invites',
            code: ErrorCode.ROLE_IN_USE,
          });
        }

        await tx.role.delete({ where: { id: role.id } });
      }
    );
  }

  private assertPermissionsSubset(
    granted: readonly string[],
    actor: readonly string[]
  ): void {
    if (!permissionsAreSubset(granted, actor)) {
      throw new ForbiddenException({
        message: 'You cannot grant permissions you do not have',
        code: ErrorCode.ROLE_ESCALATION,
      });
    }
  }

  /** Actor may only edit/delete roles whose permissions are ⊆ theirs. */
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

  private assertNotReservedName(name: string): void {
    if (RESERVED_ROLE_NAMES_LOWER.has(name.toLowerCase())) {
      throw new ConflictException('This role name is reserved');
    }
  }

  private async assertCustomRoleLimit(
    tx: Prisma.TransactionClient,
    spaceId: string
  ): Promise<void> {
    const customCount = await tx.role.count({
      where: { spaceId, isSystem: false },
    });
    if (customCount >= MAX_CUSTOM_ROLES) {
      throw new ConflictException({
        message: `A workspace can have at most ${MAX_CUSTOM_ROLES} custom permission templates`,
        code: ErrorCode.ROLE_LIMIT_REACHED,
      });
    }
  }

  private async assertUniqueName(
    tx: Prisma.TransactionClient,
    spaceId: string,
    name: string,
    excludeId?: string
  ): Promise<void> {
    const existing = await tx.role.findFirst({
      where: {
        spaceId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A role with this name already exists');
    }
  }

  private async requireRole(
    tx: Prisma.TransactionClient,
    spaceId: string,
    roleId: string
  ): Promise<{
    id: string;
    name: string;
    permissions: string[];
    isSystem: boolean;
  }> {
    if (!isUuid(roleId)) {
      throw new NotFoundException('Role not found');
    }
    const role = await tx.role.findFirst({
      where: { id: roleId, spaceId },
      select: {
        id: true,
        name: true,
        permissions: true,
        isSystem: true,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private async isDefaultRole(
    tx: Prisma.TransactionClient,
    spaceId: string,
    roleId: string
  ): Promise<boolean> {
    const space = await tx.space.findFirstOrThrow({
      where: { id: spaceId },
      select: { defaultRoleId: true },
    });
    return space.defaultRoleId === roleId;
  }

  private toOption(
    row: {
      id: string;
      name: string;
      permissions: string[];
      isSystem: boolean;
      _count: { memberships: number };
    },
    defaultRoleId: string | null
  ): SpaceRoleOption {
    return {
      id: row.id,
      name: row.name,
      permissions: row.permissions as Permission[],
      isSystem: row.isSystem,
      isDefault: row.id === defaultRoleId,
      memberCount: row._count.memberships,
    };
  }
}
