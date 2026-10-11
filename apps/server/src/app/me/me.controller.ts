import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import { PROBLEM_DETAILS_REF } from '../../common/swagger/build-openapi-document';
import { SESSION_SECURITY } from '../../common/swagger/merge-auth-openapi';

@ApiTags('me')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('me')
export class MeController {
  @Get()
  @ApiOperation({ summary: 'Current signed-in user' })
  @ApiResponse({ status: 200, description: 'The signed-in user' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  getMe(@Session() session: UserSession<Auth>) {
    // Pick fields explicitly: columns added later stay private by default.
    const { id, email, name, emailVerified, image, locale } = session.user;
    return { id, email, name, emailVerified, image: image ?? null, locale };
  }
}