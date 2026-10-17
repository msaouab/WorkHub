import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import type { MeSpacesResponse } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { SpacesService } from '../spaces.service';

@ApiTags('me')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('me')
export class MeSpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Get('spaces')
  @ApiOperation({ summary: 'Workspaces I belong to' })
  @ApiResponse({ status: 200, description: 'My workspaces and roles' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  listMySpaces(
    @Session() session: UserSession<Auth>
  ): Promise<MeSpacesResponse> {
    return this.spaces.listMine(session.user.id);
  }
}
