import {
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
  ListSpaceMembersResponse,
  SpaceMember,
} from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { ListSpaceMembersQueryDto } from '../dto/list-space-members-query.dto';
import { MembersService } from '../members.service';

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId/members')
@UseGuards(SpaceGuard, RequirePermissionGuard)
export class SpaceMembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List workspace members' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Member page' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async list(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @Query() query: ListSpaceMembersQueryDto
  ): Promise<ListSpaceMembersResponse> {
    return this.members.list(access, query);
  }

  @Post(':membershipId/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.MEMBERS_WRITE)
  @ApiOperation({ summary: 'Deactivate a member' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'membershipId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Member deactivated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async deactivate(
    @Param('spaceId') _spaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceMember> {
    return this.members.deactivate(access, membershipId);
  }

  @Post(':membershipId/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.MEMBERS_WRITE)
  @ApiOperation({ summary: 'Reactivate a member' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'membershipId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Member reactivated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async reactivate(
    @Param('spaceId') _spaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceMember> {
    return this.members.reactivate(access, membershipId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave this workspace' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Left the workspace' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async leave(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.members.leave(access);
  }

  @Delete(':membershipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSIONS.MEMBERS_WRITE)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'membershipId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async remove(
    @Param('spaceId') _spaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.members.remove(access, membershipId);
  }
}
