import { Module } from '@nestjs/common';
import { DatabaseModule } from '@work-hub/database';
import { MeController } from './controllers/me.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MeController],
  providers: [UsersService],
})
export class UsersModule {}
