import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Permission } from '@work-hub/constants';
import { PrismaService } from '@work-hub/database';
import type { Request } from 'express';
import { SPACE_ACCESS_KEY, type SpaceAccess } from './space.types';

type AuthedRequest = Request & {
  user?: { id?: string } | null;
  [SPACE_ACCESS_KEY]?: SpaceAccess;
};

/** RFC 4122 / 9562 UUID (any version). Guards run before pipes, so validate here. */
const SPACE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads membership + role from the DB on every request (never from the session).
 * Non-member → 404 (hide existence). Deactivated → 403.
 */
@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const spaceId = request.params['spaceId'];
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }
    if (
      !spaceId ||
      typeof spaceId !== 'string' ||
      !SPACE_ID_RE.test(spaceId)
    ) {
      throw new NotFoundException('Space not found');
    }

    const membership = await this.prisma.withTenant({ userId }, (tx) =>
      tx.membership.findUnique({
        where: {
          spaceId_userId: { spaceId, userId },
        },
        include: { role: true },
      })
    );

    if (!membership) {
      throw new NotFoundException('Space not found');
    }
    if (membership.status === 'deactivated') {
      throw new ForbiddenException('Membership is deactivated');
    }

    const access: SpaceAccess = {
      spaceId,
      userId,
      membershipId: membership.id,
      membershipStatus: membership.status,
      roleId: membership.role.id,
      roleName: membership.role.name,
      permissions: membership.role.permissions as Permission[],
    };
    request[SPACE_ACCESS_KEY] = access;
    return true;
  }
}
