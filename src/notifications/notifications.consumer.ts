import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as _ from 'lodash';
import { PrismaService } from 'src/prisma/prisma.service';

import { NAME, PROCCESS_NOTIFICATION_EVENTS } from './constants';
import { NotificationsGateway } from './notifications.gateway';

@Processor(NAME)
export class NotificationsConsumer {
  private logger = new Logger(NotificationsConsumer.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @Process(PROCCESS_NOTIFICATION_EVENTS.CREATE_NOTIFICATION)
  async createNotification(job: Job) {
    return {};
  }

  @Process(PROCCESS_NOTIFICATION_EVENTS.UPDATE_NOTIFICATION)
  async updateNotification(job: Job) {
    return {};
  }

  @Process(PROCCESS_NOTIFICATION_EVENTS.DELETE_NOTIFICATION)
  async deleteNotification(job: Job) {
    return {};
  }

  @OnQueueActive()
  onQueueActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
}
