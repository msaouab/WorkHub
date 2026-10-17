import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { SpaceAccess } from '@work-hub/access';
import {
  defaultCoverPreset,
  SYSTEM_ROLE_NAMES,
  type CoverPreset,
  type Permission,
} from '@work-hub/constants';
import type {
  CreateSpace,
  MeSpace,
  PatchSpaceCover,
  SpaceResponse,
} from '@work-hub/contracts';
import {
  Prisma,
  PrismaService,
  uuidv7,
} from '@work-hub/database';
import {
  ImageProcessError,
  processCover,
  processSquareImage,
  StorageService,
} from '@work-hub/storage';
import { brandingFromRow } from './branding';
import { systemRolesFor } from './system-roles';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const COVER_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async create(userId: string, input: CreateSpace): Promise<SpaceResponse> {
    const spaceId = uuidv7();
    const { roles, defaultRoleId, roleIds } = systemRolesFor(spaceId);
    const coverPreset = defaultCoverPreset(spaceId);

    try {
      // Pre-set app.space_id so INSERT…RETURNING uses the normal tenant policies.
      return await this.prisma.withTenant(
        { userId, spaceId },
        async (tx) => {
          const space = await tx.space.create({
            data: {
              id: spaceId,
              name: input.name,
              slug: input.slug,
              coverPreset,
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
            where: { id: space.id },
            data: { defaultRoleId },
          });

          const membership = await tx.membership.create({
            data: {
              spaceId: space.id,
              userId,
              roleId: roleIds[SYSTEM_ROLE_NAMES.OWNER],
              status: 'active',
            },
          });

          const ownerRole = roles.find(
            (role) => role.name === SYSTEM_ROLE_NAMES.OWNER
          )!;

          return this.toSpaceResponse(
            {
              id: space.id,
              name: space.name,
              slug: space.slug,
              logoKey: space.logoKey,
              coverKey: space.coverKey,
              coverPreset: space.coverPreset,
              coverPositionY: space.coverPositionY,
            },
            {
              name: ownerRole.name,
              permissions: ownerRole.permissions as Permission[],
            },
            membership.status
          );
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
      .map((row) => {
        const branding = brandingFromRow(row.space, this.storage);
        return {
          id: row.space.id,
          name: row.space.name,
          slug: row.space.slug,
          roleName: row.role.name,
          permissions: row.role.permissions as Permission[],
          membershipStatus: row.status,
          ...branding,
        };
      });
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

    return this.toSpaceResponse(
      space,
      {
        name: access.roleName,
        permissions: [...access.permissions],
      },
      access.membershipStatus
    );
  }

  async putLogo(access: SpaceAccess, file: Buffer): Promise<SpaceResponse> {
    const processed = await this.runImage(() =>
      processSquareImage(file, LOGO_MAX_BYTES)
    );
    const prefix = `spaces/${access.spaceId}/logo/${uuidv7()}`;
    await this.storage.put(`${prefix}/256.webp`, processed.webp256, 'image/webp');
    await this.storage.put(`${prefix}/64.webp`, processed.webp64, 'image/webp');

    const previous = await this.updateBranding(access, { logoKey: prefix });
    await this.deleteLogoKeys(previous.logoKey);
    return this.getForAccess(access);
  }

  async deleteLogo(access: SpaceAccess): Promise<void> {
    const previous = await this.updateBranding(access, { logoKey: null });
    await this.deleteLogoKeys(previous.logoKey);
  }

  async putCover(access: SpaceAccess, file: Buffer): Promise<SpaceResponse> {
    const processed = await this.runImage(() =>
      processCover(file, COVER_MAX_BYTES)
    );
    const prefix = `spaces/${access.spaceId}/cover/${uuidv7()}`;
    await this.storage.put(
      `${prefix}/1600.webp`,
      processed.webp1600,
      'image/webp'
    );
    await this.storage.put(
      `${prefix}/3200.webp`,
      processed.webp3200,
      'image/webp'
    );

    const previous = await this.updateBranding(access, {
      coverKey: prefix,
      coverPreset: null,
    });
    await this.deleteCoverKeys(previous.coverKey);
    return this.getForAccess(access);
  }

  async patchCover(
    access: SpaceAccess,
    input: PatchSpaceCover
  ): Promise<SpaceResponse> {
    const data: {
      coverKey?: string | null;
      coverPreset?: string | null;
      coverPositionY?: number;
    } = {};

    if (input.positionY !== undefined) {
      data.coverPositionY = input.positionY;
    }

    if (input.preset !== undefined) {
      if (input.preset === null) {
        data.coverKey = null;
        data.coverPreset = null;
      } else {
        data.coverKey = null;
        data.coverPreset = input.preset as CoverPreset;
      }
    }

    const previous = await this.updateBranding(access, data);
    if (input.preset !== undefined) {
      await this.deleteCoverKeys(previous.coverKey);
    }
    return this.getForAccess(access);
  }

  async deleteCover(access: SpaceAccess): Promise<void> {
    const previous = await this.updateBranding(access, {
      coverKey: null,
      coverPreset: null,
    });
    await this.deleteCoverKeys(previous.coverKey);
  }

  private toSpaceResponse(
    space: {
      id: string;
      name: string;
      slug: string;
      logoKey: string | null;
      coverKey: string | null;
      coverPreset: string | null;
      coverPositionY: number;
    },
    role: { name: string; permissions: Permission[] },
    membershipStatus: 'active' | 'deactivated'
  ): SpaceResponse {
    return {
      id: space.id,
      name: space.name,
      slug: space.slug,
      role,
      membershipStatus,
      ...brandingFromRow(space, this.storage),
    };
  }

  private async updateBranding(
    access: SpaceAccess,
    data: {
      logoKey?: string | null;
      coverKey?: string | null;
      coverPreset?: string | null;
      coverPositionY?: number;
    }
  ): Promise<{ logoKey: string | null; coverKey: string | null }> {
    const updated = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const current = await tx.space.findFirst({
          where: { id: access.spaceId, deletedAt: null },
        });
        if (!current) {
          throw new NotFoundException('Space not found');
        }
        await tx.space.update({
          where: { id: access.spaceId },
          data,
        });
        return {
          logoKey: current.logoKey,
          coverKey: current.coverKey,
        };
      }
    );
    return updated;
  }

  private async deleteLogoKeys(prefix: string | null): Promise<void> {
    if (!prefix) {
      return;
    }
    await this.safeDelete(`${prefix}/64.webp`);
    await this.safeDelete(`${prefix}/256.webp`);
  }

  private async deleteCoverKeys(prefix: string | null): Promise<void> {
    if (!prefix) {
      return;
    }
    await this.safeDelete(`${prefix}/1600.webp`);
    await this.safeDelete(`${prefix}/3200.webp`);
  }

  private async safeDelete(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.warn(`Failed to delete storage object ${key}: ${String(error)}`);
    }
  }

  private async runImage<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ImageProcessError) {
        const status =
          error.code === 'IMAGE_TOO_LARGE'
            ? HttpStatus.PAYLOAD_TOO_LARGE
            : error.code === 'IMAGE_UNSUPPORTED_TYPE'
              ? HttpStatus.UNSUPPORTED_MEDIA_TYPE
              : HttpStatus.UNPROCESSABLE_ENTITY;
        throw new HttpException(
          { message: error.message, code: error.code },
          status
        );
      }
      throw error;
    }
  }
}
