import { Module } from '@nestjs/common';
import { AccessModule } from '@work-hub/access';
import { DatabaseModule } from '@work-hub/database';
import { MeSpacesController } from './controllers/me-spaces.controller';
import { SpacesController } from './controllers/spaces.controller';
import { SpacesService } from './spaces.service';

@Module({
  imports: [DatabaseModule, AccessModule],
  controllers: [SpacesController, MeSpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
