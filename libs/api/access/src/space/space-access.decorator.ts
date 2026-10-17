import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { SPACE_ACCESS_KEY, type SpaceAccess } from './space.types';

/** The membership SpaceGuard attached for this request. */
export const CurrentSpaceAccess = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SpaceAccess => {
    const request = ctx.switchToHttp().getRequest<{
      [SPACE_ACCESS_KEY]?: SpaceAccess;
    }>();
    const access = request[SPACE_ACCESS_KEY];
    if (!access) {
      throw new Error('CurrentSpaceAccess used without SpaceGuard');
    }
    return access;
  }
);
