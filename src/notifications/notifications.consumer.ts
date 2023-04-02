import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { NotificationEntityName, NotificationStatus } from '@prisma/client';
import { Job } from 'bull';
import * as _ from 'lodash';
import { PrismaService } from 'src/prisma/prisma.service';

import { NAME, SOCKET_NOTIFICATION_EVENTS } from './constants';
import {
  CreateNotificationDto,
  DeleteNotificationDto,
  UpdateNotificationDto,
} from './dtos';
import { notificationSelect } from './notifcations.type';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Processor(NAME)
export class NotificationsConsumer {
  private logger = new Logger(NotificationsConsumer.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
  ) {}

  @Process(SOCKET_NOTIFICATION_EVENTS.CREATE_NOTIFICATION)
  async createNotification(
    job: Job<CreateNotificationDto & { sourceUserId: string }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { entity, referenceId } = job.data;

      if (entity !== NotificationEntityName.None) {
        await tx[_.camelCase(entity)].findUniqueOrThrow({
          where: { id: referenceId ?? '_' },
        });
      }

      return tx.notification.create({
        select: notificationSelect,
        data: job.data,
      });
    });
  }

  @Process(SOCKET_NOTIFICATION_EVENTS.UPDATE_NOTIFICATION)
  async updateNotification(
    job: Job<UpdateNotificationDto & { targetUserId: string }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { id, status, targetUserId } = job.data;

      const notification = await tx.notification.findFirstOrThrow({
        select: notificationSelect,
        where: { id, targetUserId },
      });

      const { status: currentStatus } = notification;

      if (
        (status === NotificationStatus.Delivered &&
          currentStatus !== NotificationStatus.Queued &&
          currentStatus !== NotificationStatus.Sent) ||
        (status === NotificationStatus.Viewed &&
          (currentStatus === NotificationStatus.Read ||
            currentStatus === NotificationStatus.Archived))
      ) {
        return notification;
      }

      return tx.notification.update({
        select: notificationSelect,
        data: { status },
        where: { id },
      });
    });
  }

  @Process(SOCKET_NOTIFICATION_EVENTS.DELETE_NOTIFICATION)
  async deleteNotification(
    job: Job<DeleteNotificationDto & { targetUserId: string }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { id, targetUserId } = job.data;

      await tx.notification.findFirstOrThrow({
        where: { id, targetUserId },
      });

      return tx.notification.delete({
        select: notificationSelect,
        where: { id },
      });
    });
  }

  @OnQueueActive()
  onQueueActive(job: Job) {
    this.logger.log(`Processing job name(${job.name})...`);
  }

  @OnQueueCompleted()
  onQueueCompleted(
    job: Job,
    result: Awaited<ReturnType<NotificationsService['getNotificationById']>>,
  ) {
    if (result.status !== NotificationStatus.Queued) {
      this.notificationsGateway.namespace
        .to(result.targetUser.id)
        .emit(job.name, result);
    }

    this.logger.log(
      `Completed job name(${job.name}) to target user(${result.targetUser.id})`,
    );
  }

  @OnQueueFailed()
  onQueueFailed(job: Job, error: unknown) {
    this.logger.error(
      `Failed job name(${job.name}) to target user(${job.data.targetUserId})`,
    );
    this.logger.error(`Queue error ${error}`);
  }
}
