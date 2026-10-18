import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SpaceAccess } from '@work-hub/access';
import { ErrorCode, PERMISSIONS } from '@work-hub/constants';
import type {
  CreateSpaceTeam,
  ListSpaceTeamsResponse,
  PatchSpaceTeam,
  SpaceTeam,
  SpaceTeamPerson,
} from '@work-hub/contracts';
import { Prisma, PrismaService, uuidv7 } from '@work-hub/database';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type MembershipPersonRow = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type TeamRow = {
  id: string;
  name: string;
  createdAt: Date;
  members: Array<{ membership: MembershipPersonRow }>;
  managers: Array<{ membership: MembershipPersonRow }>;
};

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(access: SpaceAccess): Promise<ListSpaceTeamsResponse> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const rows = await tx.team.findMany({
          where: { spaceId: access.spaceId },
          orderBy: { name: 'asc' },
          include: this.teamInclude(),
        });
        return { items: rows.map((row) => this.toTeam(row)) };
      }
    );
  }

  async create(
    access: SpaceAccess,
    input: CreateSpaceTeam
  ): Promise<SpaceTeam> {
    const memberIds = uniqueIds(input.memberIds ?? []);
    const managerIds = uniqueIds(input.managerIds ?? []);

    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        await this.assertActiveMemberships(
          tx,
          access.spaceId,
          uniqueIds([...memberIds, ...managerIds])
        );
        await this.assertManagersCanApprove(tx, access.spaceId, managerIds);

        try {
          const created = await tx.team.create({
            data: {
              id: uuidv7(),
              spaceId: access.spaceId,
              name: input.name,
            },
          });
          await this.replaceMembers(tx, access.spaceId, created.id, memberIds);
          await this.replaceManagers(
            tx,
            access.spaceId,
            created.id,
            managerIds
          );
          return this.loadTeam(tx, access.spaceId, created.id);
        } catch (error) {
          this.rethrowNameConflict(error);
          throw error;
        }
      }
    );
  }

  async update(
    access: SpaceAccess,
    teamId: string,
    input: PatchSpaceTeam
  ): Promise<SpaceTeam> {
    if (!isUuid(teamId)) {
      throw new NotFoundException({
        message: 'Team not found',
        code: ErrorCode.NOT_FOUND,
      });
    }

    const memberIds =
      input.memberIds !== undefined ? uniqueIds(input.memberIds) : undefined;
    const managerIds =
      input.managerIds !== undefined ? uniqueIds(input.managerIds) : undefined;

    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const existing = await tx.team.findFirst({
          where: { id: teamId, spaceId: access.spaceId },
          select: { id: true },
        });
        if (!existing) {
          throw new NotFoundException({
            message: 'Team not found',
            code: ErrorCode.NOT_FOUND,
          });
        }

        await this.assertActiveMemberships(
          tx,
          access.spaceId,
          uniqueIds([...(memberIds ?? []), ...(managerIds ?? [])])
        );
        if (managerIds !== undefined) {
          await this.assertManagersCanApprove(tx, access.spaceId, managerIds);
        }

        try {
          if (input.name !== undefined) {
            await tx.team.update({
              where: { id: teamId },
              data: { name: input.name },
            });
          }
        } catch (error) {
          this.rethrowNameConflict(error);
          throw error;
        }

        if (memberIds !== undefined) {
          await this.replaceMembers(tx, access.spaceId, teamId, memberIds);
        }
        if (managerIds !== undefined) {
          await this.replaceManagers(tx, access.spaceId, teamId, managerIds);
        }

        return this.loadTeam(tx, access.spaceId, teamId);
      }
    );
  }

  async delete(access: SpaceAccess, teamId: string): Promise<void> {
    if (!isUuid(teamId)) {
      throw new NotFoundException({
        message: 'Team not found',
        code: ErrorCode.NOT_FOUND,
      });
    }

    await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const result = await tx.team.deleteMany({
          where: { id: teamId, spaceId: access.spaceId },
        });
        if (result.count === 0) {
          throw new NotFoundException({
            message: 'Team not found',
            code: ErrorCode.NOT_FOUND,
          });
        }
      }
    );
  }

  private teamInclude() {
    return {
      members: {
        include: {
          membership: {
            select: {
              id: true,
              userId: true,
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
        orderBy: { membership: { user: { name: 'asc' as const } } },
      },
      managers: {
        include: {
          membership: {
            select: {
              id: true,
              userId: true,
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
        orderBy: { membership: { user: { name: 'asc' as const } } },
      },
    } as const;
  }

  private async loadTeam(
    tx: Prisma.TransactionClient,
    spaceId: string,
    teamId: string
  ): Promise<SpaceTeam> {
    const row = await tx.team.findFirstOrThrow({
      where: { id: teamId, spaceId },
      include: this.teamInclude(),
    });
    return this.toTeam(row);
  }

  private async assertActiveMemberships(
    tx: Prisma.TransactionClient,
    spaceId: string,
    membershipIds: string[]
  ): Promise<void> {
    if (membershipIds.length === 0) {
      return;
    }
    const found = await tx.membership.findMany({
      where: {
        spaceId,
        id: { in: membershipIds },
        status: 'active',
      },
      select: { id: true },
    });
    if (found.length !== membershipIds.length) {
      throw new BadRequestException({
        message: 'One or more members are not active in this workspace',
        code: ErrorCode.MEMBERSHIP_NOT_IN_SPACE,
      });
    }
  }

  /** Team managers must be able to approve leave (FR-MEM-06). */
  private async assertManagersCanApprove(
    tx: Prisma.TransactionClient,
    spaceId: string,
    membershipIds: string[]
  ): Promise<void> {
    if (membershipIds.length === 0) {
      return;
    }
    const rows = await tx.membership.findMany({
      where: {
        spaceId,
        id: { in: membershipIds },
        status: 'active',
      },
      select: {
        id: true,
        role: { select: { permissions: true } },
      },
    });
    const cannotApprove = rows.some(
      (row) => !row.role.permissions.includes(PERMISSIONS.LEAVE_APPROVE)
    );
    if (cannotApprove || rows.length !== membershipIds.length) {
      throw new BadRequestException({
        message: "This person's role can't approve requests",
        code: ErrorCode.VALIDATION_FAILED,
      });
    }
  }

  private async replaceMembers(
    tx: Prisma.TransactionClient,
    spaceId: string,
    teamId: string,
    membershipIds: string[]
  ): Promise<void> {
    await tx.teamMember.deleteMany({ where: { teamId, spaceId } });
    if (membershipIds.length === 0) {
      return;
    }
    await tx.teamMember.createMany({
      data: membershipIds.map((membershipId) => ({
        id: uuidv7(),
        spaceId,
        teamId,
        membershipId,
      })),
    });
  }

  private async replaceManagers(
    tx: Prisma.TransactionClient,
    spaceId: string,
    teamId: string,
    membershipIds: string[]
  ): Promise<void> {
    await tx.teamManager.deleteMany({ where: { teamId, spaceId } });
    if (membershipIds.length === 0) {
      return;
    }
    await tx.teamManager.createMany({
      data: membershipIds.map((membershipId) => ({
        id: uuidv7(),
        spaceId,
        teamId,
        membershipId,
      })),
    });
  }

  private toTeam(row: TeamRow): SpaceTeam {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      members: row.members.map((link) => this.toPerson(link.membership)),
      managers: row.managers.map((link) => this.toPerson(link.membership)),
    };
  }

  private toPerson(membership: MembershipPersonRow): SpaceTeamPerson {
    return {
      membershipId: membership.id,
      userId: membership.userId,
      name: membership.user.name,
      email: membership.user.email,
      image: membership.user.image,
    };
  }

  private rethrowNameConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        message: 'A group with this name already exists',
        code: ErrorCode.TEAM_NAME_TAKEN,
      });
    }
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
