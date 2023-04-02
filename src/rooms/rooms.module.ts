import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DropboxModule } from 'src/dropbox/dropbox.module';
import { Multer } from 'src/helpers/multer.helper';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    DropboxModule,
    MulterModule.register({
      storage: Multer.declareStorageEngine(),
    }),
    NotificationsModule,
  ],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
