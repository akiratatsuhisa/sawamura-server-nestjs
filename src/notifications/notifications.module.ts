import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    NotificationsConsumer,
    NotificationsService,
    NotificationsGateway,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
