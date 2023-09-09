import { Module } from '@nestjs/common';
import { DropboxModule } from 'src/dropbox/dropbox.module';

import { ProfileUsersController } from './profile-users.controller';
import { ProfileUsersService } from './profile-users.service';

@Module({
  imports: [DropboxModule],
  providers: [ProfileUsersService],
  exports: [ProfileUsersService],
  controllers: [ProfileUsersController],
})
export class ProfileUsersModule {}
