import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Auth } from '@work-hub/auth';
import type { MeResponse } from '@work-hub/contracts';
import { PROBLEM_DETAILS_REF, SESSION_SECURITY } from '@work-hub/core';
import { memoryStorage } from 'multer';
import { UsersService } from '../users.service';

@ApiTags('me')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('me/avatar')
export class MeAvatarController {
  constructor(private readonly users: UsersService) {}

  @Put()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload my profile picture' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 413, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 415, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 422, ...PROBLEM_DETAILS_REF })
  async putAvatar(
    @Session() session: UserSession<Auth>,
    @UploadedFile() file: Express.Multer.File | undefined
  ): Promise<MeResponse> {
    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Upload a file in the "file" field');
    }
    return this.users.putAvatar(session.user.id, file.buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove my profile picture' })
  @ApiResponse({ status: 204, description: 'Avatar removed' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  async deleteAvatar(@Session() session: UserSession<Auth>): Promise<void> {
    await this.users.deleteAvatar(session.user.id);
  }
}
