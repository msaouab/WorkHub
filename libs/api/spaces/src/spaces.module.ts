import { Module } from '@nestjs/common';
import { AccessModule } from '@work-hub/access';
import { DatabaseModule } from '@work-hub/database';
import { StorageModule } from '@work-hub/storage';
import { MeSpacesController } from './controllers/me-spaces.controller';
import { SpaceBrandingController } from './controllers/space-branding.controller';
import { SpaceMembersController } from './controllers/space-members.controller';
import { SpacesController } from './controllers/spaces.controller';
import { MembersService } from './members.service';
import { SpacesService } from './spaces.service';

@Module({
  imports: [DatabaseModule, AccessModule, StorageModule],
  controllers: [
    SpacesController,
    MeSpacesController,
    SpaceBrandingController,
    SpaceMembersController,
  ],
  providers: [SpacesService, MembersService],
  exports: [SpacesService, MembersService],
})
export class SpacesModule {}
