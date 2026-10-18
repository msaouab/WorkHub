import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentSpaceAccess,
  RequirePermission,
  RequirePermissionGuard,
  SpaceGuard,
  type SpaceAccess,
} from '@work-hub/access';
import { PERMISSIONS } from '@work-hub/constants';
import type {
  CreateSpaceEmailInvitesResponse,
  CreateSpaceInviteResponse,
  ListSpaceInvitesResponse,
  SpaceInvite,
} from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { Throttle } from '@nestjs/throttler';
import { CreateSpaceInviteDto } from '../dto/create-space-invite.dto';
import { ListSpaceInvitesQueryDto } from '../dto/list-space-invites-query.dto';
import { InvitesService } from '../invites.service';

/** Stricter than the global 100/min: invite create/resend can fan out many emails. */
const inviteSendThrottle = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId/invites')
@UseGuards(SpaceGuard, RequirePermissionGuard)
export class SpaceInvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVITES_WRITE)
  @ApiOperation({ summary: 'List workspace invites' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invite page' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async list(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @Query() query: ListSpaceInvitesQueryDto
  ): Promise<ListSpaceInvitesResponse> {
    return this.invites.list(access, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle(inviteSendThrottle)
  @RequirePermission(PERMISSIONS.INVITES_WRITE)
  @ApiOperation({ summary: 'Create email or link invites' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Invite(s) created' })
  @ApiResponse({ status: 400, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 429, ...PROBLEM_DETAILS_REF })
  async create(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @Body() body: CreateSpaceInviteDto
  ): Promise<CreateSpaceInviteResponse | CreateSpaceEmailInvitesResponse> {
    return this.invites.create(access, body);
  }

  @Post(':inviteId/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle(inviteSendThrottle)
  @RequirePermission(PERMISSIONS.INVITES_WRITE)
  @ApiOperation({ summary: 'Resend an email invite (revokes the old token)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'inviteId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invite resent' })
  @ApiResponse({ status: 400, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 429, ...PROBLEM_DETAILS_REF })
  async resend(
    @Param('spaceId') _spaceId: string,
    @Param('inviteId') inviteId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceInvite> {
    return this.invites.resend(access, inviteId);
  }

  @Delete(':inviteId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.INVITES_WRITE)
  @ApiOperation({ summary: 'Revoke a pending invite' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'inviteId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invite revoked' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async revoke(
    @Param('spaceId') _spaceId: string,
    @Param('inviteId') inviteId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceInvite> {
    return this.invites.revoke(access, inviteId);
  }
}
