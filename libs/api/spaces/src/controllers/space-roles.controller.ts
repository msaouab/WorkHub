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
import type {
  ListSpaceRolesResponse,
  SpaceRoleOption,
} from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { CreateSpaceRoleDto } from '../dto/create-space-role.dto';
import { PatchSpaceRoleDto } from '../dto/patch-space-role.dto';
import { RolesService } from '../roles.service';

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId/roles')
@UseGuards(SpaceGuard, RequirePermissionGuard)
export class SpaceRolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({
    summary: 'List workspace roles (includes Owner; invite UI filters it out)',
  })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role list' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async list(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<ListSpaceRolesResponse> {
    return this.roles.list(access);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.ROLES_WRITE)
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async create(
    @Param('spaceId') _spaceId: string,
    @Body() body: CreateSpaceRoleDto,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceRoleOption> {
    return this.roles.create(access, body);
  }

  @Patch(':roleId')
  @RequirePermission(PERMISSIONS.ROLES_WRITE)
  @ApiOperation({ summary: 'Update a role (name, permissions, or default)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async update(
    @Param('spaceId') _spaceId: string,
    @Param('roleId') roleId: string,
    @Body() body: PatchSpaceRoleDto,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<SpaceRoleOption> {
    return this.roles.update(access, roleId, body);
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(PERMISSIONS.ROLES_WRITE)
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  async remove(
    @Param('spaceId') _spaceId: string,
    @Param('roleId') roleId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.roles.delete(access, roleId);
  }
}
