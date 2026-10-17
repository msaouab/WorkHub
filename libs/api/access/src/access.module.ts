import { Module } from '@nestjs/common';
import { DatabaseModule } from '@work-hub/database';
import { RequirePermissionGuard } from './space/require-permission.guard';
import { SpaceGuard } from './space/space.guard';

/** Provides SpaceGuard + RequirePermissionGuard for space-scoped routes. */
@Module({
  imports: [DatabaseModule],
  providers: [SpaceGuard, RequirePermissionGuard],
  exports: [SpaceGuard, RequirePermissionGuard],
})
export class AccessModule {}
