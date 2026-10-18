import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SpaceAccess } from '@work-hub/access';
import { ErrorCode, SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import type {
  AcceptInviteResponse,
  CreateSpaceEmailInvitesResponse,
  CreateSpaceInvite,
  CreateSpaceInviteResponse,
  EmailInviteResult,
  InvitePreview,
  ListSpaceInvitesQuery,
  ListSpaceInvitesResponse,
  ListSpaceRolesResponse,
  SpaceInvite,
} from '@work-hub/contracts';
import { Prisma, PrismaService } from '@work-hub/database';
import { MailService } from '@work-hub/mail';
import { generateInviteToken, hashInviteToken } from './invite-token';

const EMAIL_INVITE_DAYS = 7;
const EMAIL_INVITE_MAX_USES = 1;
/** Cap outbound invite emails per workspace per UTC day (FR-MEM-02 CSV size). */
const EMAIL_INVITES_PER_DAY = 500;
const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InviteWithRole = {
  id: string;
  kind: 'email' | 'link';
  email: string | null;
  expiresAt: Date;
  maxUses: number;
  uses: number;
  revokedAt: Date | null;
  createdAt: Date;
  role: { id: string; name: string };
  creator: { id: string; name: string };
};

type InviteWithSpaceRole = Omit<InviteWithRole, 'creator'> & {
  spaceId: string;
  roleId: string;
  tokenHash: string;
  space: { id: string; name: string; slug: string };
};

const inviteInclude = {
  role: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
} as const;

/** Create / list / revoke / resend / preview / accept workspace invites. */
@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService
  ) {}

  async list(
    access: SpaceAccess,
    query: ListSpaceInvitesQuery
  ): Promise<ListSpaceInvitesResponse> {
    if (query.cursor && !isUuid(query.cursor)) {
      throw new BadRequestException('Invalid cursor');
    }

    const limit = query.limit;
    const now = new Date();
    const status = query.status;

    // Over-fetch then filter: Prisma cannot express `uses < max_uses` in where.
    const batchSize = Math.min(100, (limit + 1) * 3);
    const collected: InviteWithRole[] = [];
    let cursor = query.cursor;
    let exhausted = false;

    while (collected.length < limit + 1 && !exhausted) {
      const batch = await this.prisma.withTenant(
        { spaceId: access.spaceId, userId: access.userId },
        (tx) =>
          tx.invite.findMany({
            where: {
              spaceId: access.spaceId,
              ...(cursor ? { id: { gt: cursor } } : {}),
              ...inviteStatusPrefilter(status, now),
            },
            include: inviteInclude,
            orderBy: { id: 'asc' },
            take: batchSize,
          })
      );

      if (batch.length === 0) {
        exhausted = true;
        break;
      }

      for (const row of batch) {
        cursor = row.id;
        if (matchesInviteStatus(row, status, now)) {
          collected.push(row);
          if (collected.length >= limit + 1) {
            break;
          }
        }
      }

      if (batch.length < batchSize) {
        exhausted = true;
      }
    }

    const page = collected.slice(0, limit);
    const nextCursor =
      collected.length > limit ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((row) => this.toInvite(row)),
      nextCursor,
    };
  }

  async listRoles(access: SpaceAccess): Promise<ListSpaceRolesResponse> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const space = await tx.space.findFirstOrThrow({
          where: { id: access.spaceId },
          select: { defaultRoleId: true },
        });
        const rows = await tx.role.findMany({
          where: {
            spaceId: access.spaceId,
            name: { not: SYSTEM_ROLE_NAMES.OWNER },
          },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
        return {
          items: rows.map((row) => ({
            id: row.id,
            name: row.name,
            isDefault: row.id === space.defaultRoleId,
          })),
        };
      }
    );
  }

  async create(
    access: SpaceAccess,
    input: CreateSpaceInvite
  ): Promise<CreateSpaceInviteResponse | CreateSpaceEmailInvitesResponse> {
    if (input.kind === 'email') {
      return this.createEmailInvites(access, input);
    }
    return this.createLinkInvite(access, input);
  }

  async resend(access: SpaceAccess, inviteId: string): Promise<SpaceInvite> {
    const appOrigin = this.appOrigin();

    const prepared = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        if (!isUuid(inviteId)) {
          throw new NotFoundException({
            message: 'Invite not found',
            code: ErrorCode.INVITE_NOT_FOUND,
          });
        }

        const existing = await tx.invite.findFirst({
          where: { id: inviteId, spaceId: access.spaceId },
          include: inviteInclude,
        });
        if (!existing) {
          throw new NotFoundException({
            message: 'Invite not found',
            code: ErrorCode.INVITE_NOT_FOUND,
          });
        }
        if (existing.kind !== 'email' || !existing.email) {
          throw new BadRequestException('Only email invites can be resent');
        }

        await assertEmailInviteBudget(tx, access.spaceId, 1);

        if (!existing.revokedAt) {
          await tx.invite.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() },
          });
        }

        const token = generateInviteToken();
        const tokenHash = hashInviteToken(token);
        const expiresAt = addDays(new Date(), EMAIL_INVITE_DAYS);
        const row = await tx.invite.create({
          data: {
            spaceId: access.spaceId,
            roleId: existing.roleId,
            kind: 'email',
            email: existing.email,
            tokenHash,
            expiresAt,
            maxUses: EMAIL_INVITE_MAX_USES,
            createdBy: access.userId,
          },
          include: inviteInclude,
        });

        const space = await tx.space.findFirstOrThrow({
          where: { id: access.spaceId },
          select: { name: true },
        });

        return { row, token, spaceName: space.name, email: existing.email };
      }
    );

    await this.mail.sendSpaceInvite({
      to: prepared.email,
      spaceName: prepared.spaceName,
      roleName: prepared.row.role.name,
      url: inviteAcceptUrl(appOrigin, prepared.token),
      expiresAt: prepared.row.expiresAt,
    });

    return this.toInvite(prepared.row);
  }

  async revoke(access: SpaceAccess, inviteId: string): Promise<SpaceInvite> {
    return this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        if (!isUuid(inviteId)) {
          throw new NotFoundException({
            message: 'Invite not found',
            code: ErrorCode.INVITE_NOT_FOUND,
          });
        }

        const row = await tx.invite.findFirst({
          where: { id: inviteId, spaceId: access.spaceId },
          include: inviteInclude,
        });
        if (!row) {
          throw new NotFoundException({
            message: 'Invite not found',
            code: ErrorCode.INVITE_NOT_FOUND,
          });
        }

        if (row.revokedAt) {
          return this.toInvite(row);
        }

        const updated = await tx.invite.update({
          where: { id: row.id },
          data: { revokedAt: new Date() },
          include: inviteInclude,
        });
        return this.toInvite(updated);
      }
    );
  }

  async preview(token: string): Promise<InvitePreview> {
    const invite = await this.loadByToken(token);
    this.assertInviteOpen(invite);
    return {
      spaceName: invite.space.name,
      spaceSlug: invite.space.slug,
      roleName: invite.role.name,
      kind: invite.kind,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async accept(
    token: string,
    userId: string,
    userEmail: string
  ): Promise<AcceptInviteResponse> {
    const tokenHash = hashInviteToken(token);

    return this.prisma.withTenant(
      { userId, inviteTokenHash: tokenHash },
      async (tx) => {
        const invite = await tx.invite.findFirst({
          where: { tokenHash },
          include: {
            space: { select: { id: true, name: true, slug: true } },
            role: { select: { id: true, name: true } },
          },
        });
        if (!invite) {
          throw new NotFoundException({
            message: 'Invite not found',
            code: ErrorCode.INVITE_NOT_FOUND,
          });
        }

        this.assertInviteOpen(invite);

        if (
          invite.kind === 'email' &&
          invite.email &&
          invite.email.toLowerCase() !== userEmail.toLowerCase()
        ) {
          throw new ForbiddenException({
            message: 'This invite is for a different email address',
            code: ErrorCode.INVITE_EMAIL_MISMATCH,
          });
        }

        const existing = await tx.membership.findFirst({
          where: { spaceId: invite.spaceId, userId },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException({
            message: 'You are already a member of this workspace',
            code: ErrorCode.ALREADY_MEMBER,
          });
        }

        // Claim a use first so concurrent accepts cannot both succeed.
        const claimed = await tx.invite.updateMany({
          where: {
            id: invite.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            uses: { lt: invite.maxUses },
          },
          data: { uses: { increment: 1 } },
        });
        if (claimed.count !== 1) {
          throw new GoneException({
            message: 'Invite has no uses left',
            code: ErrorCode.INVITE_EXHAUSTED,
          });
        }

        await tx.membership.create({
          data: {
            spaceId: invite.spaceId,
            userId,
            roleId: invite.roleId,
            status: 'active',
          },
        });

        return {
          spaceId: invite.space.id,
          spaceSlug: invite.space.slug,
          spaceName: invite.space.name,
        };
      }
    );
  }

  private async createLinkInvite(
    access: SpaceAccess,
    input: CreateSpaceInvite
  ): Promise<CreateSpaceInviteResponse> {
    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);
    const appOrigin = this.appOrigin();

    const row = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        const roleId = await this.resolveRoleId(tx, access.spaceId, input.roleId);
        const expiresAt = addDays(new Date(), input.expiresInDays);
        return tx.invite.create({
          data: {
            spaceId: access.spaceId,
            roleId,
            kind: 'link',
            email: null,
            tokenHash,
            expiresAt,
            maxUses: input.maxUses,
            createdBy: access.userId,
          },
          include: inviteInclude,
        });
      }
    );

    return {
      ...this.toInvite(row),
      token,
      url: inviteAcceptUrl(appOrigin, token),
    };
  }

  private async createEmailInvites(
    access: SpaceAccess,
    input: CreateSpaceInvite
  ): Promise<CreateSpaceEmailInvitesResponse> {
    const addresses = normalizeInviteEmails(input);
    const appOrigin = this.appOrigin();
    const results: EmailInviteResult[] = [];

    const prepared = await this.prisma.withTenant(
      { spaceId: access.spaceId, userId: access.userId },
      async (tx) => {
        await assertEmailInviteBudget(tx, access.spaceId, addresses.length);

        const roleId = await this.resolveRoleId(tx, access.spaceId, input.roleId);
        const space = await tx.space.findFirstOrThrow({
          where: { id: access.spaceId },
          select: { id: true, name: true, slug: true },
        });

        const toSend: {
          email: string;
          token: string;
          row: InviteWithRole;
        }[] = [];

        for (const raw of addresses) {
          if (!EMAIL_RE.test(raw)) {
            results.push({ email: raw, status: 'invalid' });
            continue;
          }
          const email = raw.toLowerCase();

          const existingMember = await tx.membership.findFirst({
            where: {
              spaceId: access.spaceId,
              user: { email },
            },
            select: { id: true },
          });
          if (existingMember) {
            results.push({ email, status: 'already_member' });
            continue;
          }

          const pending = await tx.invite.findFirst({
            where: {
              spaceId: access.spaceId,
              kind: 'email',
              email,
              revokedAt: null,
              expiresAt: { gt: new Date() },
              uses: { lt: EMAIL_INVITE_MAX_USES },
            },
            select: { id: true },
          });
          if (pending) {
            results.push({ email, status: 'already_invited' });
            continue;
          }

          const token = generateInviteToken();
          const tokenHash = hashInviteToken(token);
          const expiresAt = addDays(new Date(), EMAIL_INVITE_DAYS);
          const row = await tx.invite.create({
            data: {
              spaceId: access.spaceId,
              roleId,
              kind: 'email',
              email,
              tokenHash,
              expiresAt,
              maxUses: EMAIL_INVITE_MAX_USES,
              createdBy: access.userId,
            },
            include: inviteInclude,
          });

          const invite = this.toInvite(row);
          results.push({ email, status: 'created', invite });
          toSend.push({ email, token, row });
        }

        return { space, toSend };
      }
    );

    for (const item of prepared.toSend) {
      await this.mail.sendSpaceInvite({
        to: item.email,
        spaceName: prepared.space.name,
        roleName: item.row.role.name,
        url: inviteAcceptUrl(appOrigin, item.token),
        expiresAt: item.row.expiresAt,
      });
    }

    return { results };
  }

  private async loadByToken(token: string): Promise<InviteWithSpaceRole> {
    if (!token || token.length < 16 || token.length > 200) {
      throw new NotFoundException({
        message: 'Invite not found',
        code: ErrorCode.INVITE_NOT_FOUND,
      });
    }

    const tokenHash = hashInviteToken(token);
    const invite = await this.prisma.withTenant(
      { inviteTokenHash: tokenHash },
      (tx) =>
        tx.invite.findFirst({
          where: { tokenHash },
          include: {
            space: { select: { id: true, name: true, slug: true } },
            role: { select: { id: true, name: true } },
          },
        })
    );

    if (!invite) {
      throw new NotFoundException({
        message: 'Invite not found',
        code: ErrorCode.INVITE_NOT_FOUND,
      });
    }

    return invite;
  }

  private assertInviteOpen(invite: {
    revokedAt: Date | null;
    expiresAt: Date;
    uses: number;
    maxUses: number;
  }): void {
    if (invite.revokedAt) {
      throw new GoneException({
        message: 'Invite has been revoked',
        code: ErrorCode.INVITE_REVOKED,
      });
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new GoneException({
        message: 'Invite has expired',
        code: ErrorCode.INVITE_EXPIRED,
      });
    }
    if (invite.uses >= invite.maxUses) {
      throw new GoneException({
        message: 'Invite has no uses left',
        code: ErrorCode.INVITE_EXHAUSTED,
      });
    }
  }

  private async resolveRoleId(
    tx: Prisma.TransactionClient,
    spaceId: string,
    roleId: string | undefined
  ): Promise<string> {
    if (roleId) {
      if (!isUuid(roleId)) {
        throw new BadRequestException('Invalid roleId');
      }
      const role = await tx.role.findFirst({
        where: { id: roleId, spaceId },
        select: { id: true, name: true },
      });
      if (!role) {
        throw new BadRequestException('Role not found in this workspace');
      }
      if (role.name === SYSTEM_ROLE_NAMES.OWNER) {
        throw new BadRequestException('Cannot invite as Owner');
      }
      return role.id;
    }

    const space = await tx.space.findFirstOrThrow({
      where: { id: spaceId },
      select: { defaultRoleId: true },
    });
    if (!space.defaultRoleId) {
      throw new BadRequestException('Workspace has no default role');
    }
    return space.defaultRoleId;
  }

  private toInvite(row: InviteWithRole): SpaceInvite {
    return {
      id: row.id,
      kind: row.kind,
      email: row.email,
      role: { id: row.role.id, name: row.role.name },
      expiresAt: row.expiresAt.toISOString(),
      maxUses: row.maxUses,
      uses: row.uses,
      revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      createdBy: { id: row.creator.id, name: row.creator.name },
    };
  }

  private appOrigin(): string {
    const origins = this.config.get<string[]>('corsOrigins') ?? [];
    const origin = origins[0]?.replace(/\/$/, '');
    if (!origin) {
      throw new BadRequestException('App origin is not configured');
    }
    return origin;
  }
}

/** Broad DB prefilter; `matchesInviteStatus` applies uses vs maxUses. */
function inviteStatusPrefilter(
  status: ListSpaceInvitesQuery['status'],
  now: Date
): Prisma.InviteWhereInput {
  if (status === 'pending') {
    return {
      revokedAt: null,
      expiresAt: { gt: now },
    };
  }
  if (status === 'past') {
    // Exhausted invites (uses >= maxUses) look "open" in a revoked/expiry prefilter;
    // scan and keep !pending in memory.
    void now;
    return {};
  }
  return {};
}

function isInvitePending(
  row: { revokedAt: Date | null; expiresAt: Date; uses: number; maxUses: number },
  now: Date
): boolean {
  return (
    row.revokedAt === null &&
    row.expiresAt.getTime() > now.getTime() &&
    row.uses < row.maxUses
  );
}

function matchesInviteStatus(
  row: { revokedAt: Date | null; expiresAt: Date; uses: number; maxUses: number },
  status: ListSpaceInvitesQuery['status'],
  now: Date
): boolean {
  const pending = isInvitePending(row, now);
  if (status === 'pending') {
    return pending;
  }
  if (status === 'past') {
    return !pending;
  }
  return true;
}

async function assertEmailInviteBudget(
  tx: Prisma.TransactionClient,
  spaceId: string,
  additional: number
): Promise<void> {
  if (additional <= 0) {
    return;
  }
  const since = startOfUtcDay(new Date());
  const used = await tx.invite.count({
    where: {
      spaceId,
      kind: 'email',
      createdAt: { gte: since },
    },
  });
  if (used + additional > EMAIL_INVITES_PER_DAY) {
    throw new HttpException(
      {
        message: 'Daily invite email limit reached for this workspace',
        code: ErrorCode.RATE_LIMITED,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function normalizeInviteEmails(input: CreateSpaceInvite): string[] {
  const list = [
    ...(input.emails ?? []),
    ...(input.email ? [input.email] : []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of list) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function inviteAcceptUrl(appOrigin: string, token: string): string {
  // Locale-less path; next-intl redirects to the user's locale.
  return `${appOrigin}/invite/${encodeURIComponent(token)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
