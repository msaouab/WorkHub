import { Module } from '@nestjs/common';
import { DatabaseModule } from '@work-hub/database';
import { StorageModule } from '@work-hub/storage';
import { MeAvatarController } from './controllers/me-avatar.controller';
import { MeController } from './controllers/me.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [MeController, MeAvatarController],
  providers: [UsersService],
})
export class UsersModule {}
