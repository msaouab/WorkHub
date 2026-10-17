import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@work-hub/constants';
import type { Request } from 'express';
import { REQUIRE_PERMISSION_KEY } from './require-permission.decorator';
import { SPACE_ACCESS_KEY, type SpaceAccess } from './space.types';

type SpaceRequest = Request & {
  [SPACE_ACCESS_KEY]?: SpaceAccess;
};

@Injectable()
export class RequirePermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<SpaceRequest>();
    const access = request[SPACE_ACCESS_KEY];
    if (!access?.permissions.includes(permission)) {
      throw new ForbiddenException('Missing permission');
    }
    return true;
  }
}
