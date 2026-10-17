import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import {
  CurrentSpaceAccess,
  RequirePermission,
  RequirePermissionGuard,
  SpaceGuard,
  type SpaceAccess,
} from '@work-hub/access';
import { PERMISSIONS } from '@work-hub/constants';
import type { SpaceResponse } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { CreateSpaceDto } from '../dto/create-space.dto';
import { SpacesService } from '../spaces.service';

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a workspace (caller becomes Owner)' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  @ApiResponse({ status: 400, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async create(
    @Session() session: UserSession<Auth>,
    @Body() body: CreateSpaceDto
  ): Promise<SpaceResponse> {
    return this.spaces.create(session.user.id, body);
  }

  @Get(':spaceId')
  @UseGuards(SpaceGuard, RequirePermissionGuard)
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'Get a workspace you belong to' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workspace and your role' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async getOne(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceResponse> {
    return this.spaces.getForAccess(access);
  }
}
