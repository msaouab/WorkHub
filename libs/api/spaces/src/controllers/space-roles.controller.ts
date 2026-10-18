import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
import type { ListSpaceRolesResponse } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { InvitesService } from '../invites.service';

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId/roles')
@UseGuards(SpaceGuard, RequirePermissionGuard)
export class SpaceRolesController {
  constructor(private readonly invites: InvitesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({
    summary: 'List assignable workspace roles (excludes Owner)',
  })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role options' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async list(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<ListSpaceRolesResponse> {
    return this.invites.listRoles(access);
  }
}
