import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
import { memoryStorage } from 'multer';
import { PatchSpaceCoverDto } from '../dto/patch-space-cover.dto';
import { SpacesService } from '../spaces.service';

const uploadThrottle = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('spaces')
@ApiCookieAuth(SESSION_SECURITY)
@Controller('spaces/:spaceId')
@UseGuards(SpaceGuard, RequirePermissionGuard)
@RequirePermission(PERMISSIONS.SPACE_SETTINGS_WRITE)
export class SpaceBrandingController {
  constructor(private readonly spaces: SpacesService) {}

  @Put('logo')
  @Throttle(uploadThrottle)
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
  @ApiOperation({ summary: 'Upload workspace logo (Owner)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Logo updated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 413, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 415, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 422, ...PROBLEM_DETAILS_REF })
  async putLogo(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @UploadedFile() file: Express.Multer.File | undefined
  ): Promise<SpaceResponse> {
    return this.spaces.putLogo(access, this.requireFile(file));
  }

  @Delete('logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove workspace logo (Owner)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Logo removed' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async deleteLogo(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.spaces.deleteLogo(access);
  }

  @Put('cover')
  @Throttle(uploadThrottle)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
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
  @ApiOperation({ summary: 'Upload workspace cover image (Owner)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Cover updated' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 413, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 415, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 422, ...PROBLEM_DETAILS_REF })
  async putCover(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @UploadedFile() file: Express.Multer.File | undefined
  ): Promise<SpaceResponse> {
    return this.spaces.putCover(access, this.requireFile(file));
  }

  @Patch('cover')
  @ApiOperation({
    summary: 'Set cover preset, clear cover, or reposition (Owner)',
  })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Cover updated' })
  @ApiResponse({ status: 400, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async patchCover(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess,
    @Body() body: PatchSpaceCoverDto
  ): Promise<SpaceResponse> {
    return this.spaces.patchCover(access, body);
  }

  @Delete('cover')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove workspace cover (Owner)' })
  @ApiParam({ name: 'spaceId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Cover removed' })
  @ApiResponse({ status: 401, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 403, ...PROBLEM_DETAILS_REF })
  @ApiResponse({ status: 404, ...PROBLEM_DETAILS_REF })
  async deleteCover(
    @Param('spaceId') _spaceId: string,
    @CurrentSpaceAccess() access: SpaceAccess
  ): Promise<void> {
    await this.spaces.deleteCover(access);
  }

  private requireFile(file: Express.Multer.File | undefined): Buffer {
    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Upload a file in the "file" field');
    }
    return file.buffer;
  }
}
