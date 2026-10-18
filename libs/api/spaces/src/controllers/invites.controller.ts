import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymous, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import type { AcceptInviteResponse, InvitePreview } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { InvitesService } from '../invites.service';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Get(':token')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Preview an invite (no auth required)' })
  @ApiParam({ name: 'token', description: 'Opaque invite token' })
  @ApiResponse({ status: 200, description: 'Invite preview' })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 410, ...PROBLEM_DETAILS_REF })
  async preview(@Param('token') token: string): Promise<InvitePreview> {
    return this.invites.preview(token);
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(SESSION_SECURITY)
  @ApiOperation({ summary: 'Accept an invite (signed-in user joins the workspace)' })
  @ApiParam({ name: 'token', description: 'Opaque invite token' })
  @ApiResponse({ status: 200, description: 'Joined workspace' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 409, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 410, ...PROBLEM_DETAILS_REF })
  async accept(
    @Param('token') token: string,
    @Session() session: UserSession<Auth>
  ): Promise<AcceptInviteResponse> {
    return this.invites.accept(token, session.user.id, session.user.email);
  }
}
