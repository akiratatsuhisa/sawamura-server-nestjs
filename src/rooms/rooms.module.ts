import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DropboxModule } from 'src/dropbox/dropbox.module';
import { Multer } from 'src/helpers/multer.helper';
import { MaterialDesignModule } from 'src/material-design/material-design.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { NAME } from './constants';
import { RoomsConsumer } from './rooms.consumer';
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
    BullModule.registerQueue({
      name: NAME,
    }),
    MaterialDesignModule,
  ],
  providers: [RoomsConsumer, RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
