import { Module } from '@nestjs/common';
import { DropboxModule } from 'src/dropbox/dropbox.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  imports: [DropboxModule],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
