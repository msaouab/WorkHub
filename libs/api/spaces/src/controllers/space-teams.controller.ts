import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import type { ListSpaceTeamsResponse, SpaceTeam } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { CreateSpaceTeamDto } from '../dto/create-space-team.dto';
import { PatchSpaceTeamDto } from '../dto/patch-space-team.dto';
import { TeamsService } from '../teams.service';

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId/teams')
@UseGuards(SpaceGuard, RequirePermissionGuard)
export class SpaceTeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List workspace groups (teams)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Group list' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async list(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<ListSpaceTeamsResponse> {
    return this.teams.list(access);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TEAMS_WRITE)
  @ApiOperation({ summary: 'Create a group' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Group created' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async create(
    @Param('spaceId') _spaceId: string,
    @Body() body: CreateSpaceTeamDto,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceTeam> {
    return this.teams.create(access, body);
  }

  @Patch(':teamId')
  @RequirePermission(PERMISSIONS.TEAMS_WRITE)
  @ApiOperation({ summary: 'Update a group (name, members, managers)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async update(
    @Param('spaceId') _spaceId: string,
    @Param('teamId') teamId: string,
    @Body() body: PatchSpaceTeamDto,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceTeam> {
    return this.teams.update(access, teamId, body);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSIONS.TEAMS_WRITE)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'teamId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Group deleted' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async remove(
    @Param('spaceId') _spaceId: string,
    @Param('teamId') teamId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.teams.delete(access, teamId);
  }
}
