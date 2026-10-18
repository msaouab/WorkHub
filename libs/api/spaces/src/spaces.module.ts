import { Module } from '@nestjs/common';
import { AccessModule } from '@work-hub/access';
import { DatabaseModule } from '@work-hub/database';
import { MailModule } from '@work-hub/mail';
import { StorageModule } from '@work-hub/storage';
import { InvitesController } from './controllers/invites.controller';
import { MeSpacesController } from './controllers/me-spaces.controller';
import { SpaceBrandingController } from './controllers/space-branding.controller';
import { SpaceInvitesController } from './controllers/space-invites.controller';
import { SpaceMembersController } from './controllers/space-members.controller';
import { SpaceRolesController } from './controllers/space-roles.controller';
import { SpaceTeamsController } from './controllers/space-teams.controller';
import { SpacesController } from './controllers/spaces.controller';
import { InvitesService } from './invites.service';
import { MembersService } from './members.service';
import { RolesService } from './roles.service';
import { SpacesService } from './spaces.service';
import { TeamsService } from './teams.service';

@Module({
  imports: [DatabaseModule, AccessModule, StorageModule, MailModule],
  controllers: [
    SpacesController,
    MeSpacesController,
    SpaceBrandingController,
    SpaceMembersController,
    SpaceRolesController,
    SpaceTeamsController,
    SpaceInvitesController,
    InvitesController,
  ],
  providers: [
    SpacesService,
    MembersService,
    RolesService,
    TeamsService,
    InvitesService,
  ],
  exports: [
    SpacesService,
    MembersService,
    RolesService,
    TeamsService,
    InvitesService,
  ],
})
export class SpacesModule {}
