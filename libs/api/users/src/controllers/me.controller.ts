import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import type { MeResponse } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { UpdateMeDto } from '../dto/update-me.dto';
import { toMeResponse, UsersService } from '../users.service';

@ApiTags('me')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Current signed-in user' })
  @ApiResponse({ status: 200, description: 'The signed-in user' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  getMe(@Session() session: UserSession<Auth>): MeResponse {
    return toMeResponse(session.user);
  }

  @Patch()
  @ApiOperation({ summary: 'Change my preferences (language)' })
  @ApiResponse({ status: 200, description: 'The updated user' })
  @ApiResponse({ status: 400, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  updateMe(
    @Session() session: UserSession<Auth>,
    @Body() body: UpdateMeDto
  ): Promise<MeResponse> {
    return this.users.updateLocale(session.user.id, body.locale);
  }
}
