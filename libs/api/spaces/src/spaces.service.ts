import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
  type Permission,
} from '@work-hub/constants';
import type {
  CreateSpace,
  MeSpace,
  SpaceResponse,
} from '@work-hub/contracts';
import type { SpaceAccess } from '@work-hub/access';
import {
  Prisma,
  PrismaService,
  uuidv7,
} from '@work-hub/database';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateSpace): Promise<SpaceResponse> {
    const spaceId = uuidv7();

    try {
      // Pre-set app.space_id so INSERT…RETURNING uses the normal tenant policies.
      return await this.prisma.withTenant(
        { userId, spaceId },
        async (tx) => {
          const space = await tx.space.create({
            data: { id: spaceId, name: input.name, slug: input.slug },
          });

          const ownerRole = await tx.role.create({
            data: {
              spaceId: space.id,
              name: SYSTEM_ROLE_NAMES.OWNER,
              permissions: [
                ...SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.OWNER],
              ],
              isSystem: true,
            },
          });
          await tx.role.create({
            data: {
              spaceId: space.id,
              name: SYSTEM_ROLE_NAMES.ADMIN,
              permissions: [
                ...SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.ADMIN],
              ],
              isSystem: true,
            },
          });
          const memberRole = await tx.role.create({
            data: {
              spaceId: space.id,
              name: SYSTEM_ROLE_NAMES.MEMBER,
              permissions: [
                ...SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_NAMES.MEMBER],
              ],
              isSystem: true,
            },
          });

          await tx.space.update({
            where: { id: space.id },
            data: { defaultRoleId: memberRole.id },
          });

          const membership = await tx.membership.create({
            data: {
              spaceId: space.id,
              userId,
              roleId: ownerRole.id,
              status: 'active',
            },
          });

          return {
            id: space.id,
            name: space.name,
            slug: space.slug,
            role: {
              name: ownerRole.name,
              permissions: ownerRole.permissions as Permission[],
            },
            membershipStatus: membership.status,
          };
        }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A workspace with this slug already exists');
      }
      throw error;
    }
  }

  async listMine(userId: string): Promise<MeSpace[]> {
    const rows = await this.prisma.withTenant({ userId }, (tx) =>
      tx.membership.findMany({
        where: { userId },
        include: { space: true, role: true },
        orderBy: { createdAt: 'asc' },
      })
    );

    return rows
      .filter((row) => row.space.deletedAt == null)
      .map((row) => ({
        id: row.space.id,
        name: row.space.name,
        slug: row.space.slug,
        roleName: row.role.name,
        membershipStatus: row.status,
      }));
  }

  async getForAccess(access: SpaceAccess): Promise<SpaceResponse> {
    const space = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      (tx) =>
        tx.space.findFirst({
          where: { id: access.spaceId, deletedAt: null },
        })
    );

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return {
      id: space.id,
      name: space.name,
      slug: space.slug,
      role: {
        name: access.roleName,
        permissions: [...access.permissions],
      },
      membershipStatus: access.membershipStatus,
    };
  }
}
