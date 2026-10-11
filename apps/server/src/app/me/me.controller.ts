import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import type { Locale } from '@work-hub/constants';
import type { MeResponse } from '@work-hub/contracts';
import { PrismaService } from '@work-hub/database';
import { PROBLEM_DETAILS_REF } from '../../common/swagger/build-openapi-document';
import { SESSION_SECURITY } from '../../common/swagger/merge-auth-openapi';
import { UpdateMeDto } from './me.dto';

type PublicUserSource = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  locale: string;
};

/** Pick fields explicitly: columns added later stay private by default. */
function toMeResponse(user: PublicUserSource): MeResponse {
  const { id, email, name, emailVerified, image, locale } = user;
  // The database enum only allows supported locales.
  return { id, email, name, emailVerified, image: image ?? null, locale: locale as Locale };
}

@ApiTags('me')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('me')
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

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
  async updateMe(
    @Session() session: UserSession<Auth>,
    @Body() body: UpdateMeDto
  ): Promise<MeResponse> {
    const user = await this.prisma.user.update({
      where: { id: session.user.id },
      data: { locale: body.locale },
    });
    return toMeResponse(user);
  }
}