import { messages, SOCKET_EVENTS } from '@akiratatsuhisa/sawamura-utils';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import {
  NotificationEntityName,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { Queue } from 'bull';
import _ from 'lodash';
import { IdentityUser } from 'src/auth/decorators';
import { AppError } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { ISocketUser } from 'src/ws-auth/interfaces';

import { NAME } from './constants';
import {
  CreateNotificationDto,
  DeleteNotificationDto,
  SearchNotificationDto,
  SearchNotificationsDto,
  UpdateNotificationDto,
} from './dtos';
import { notificationSelect } from './notifcations.factory';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(NAME) private notificationsQueue: Queue,
  ) {}

  async linkReference(
    notifcation: Awaited<
      ReturnType<NotificationsService['getNotificationById']>
    >,
  ) {
    const reference =
      notifcation.entity === NotificationEntityName.None
        ? null
        : await this.prisma[_.camelCase(notifcation.entity)].findUnique({
            where: { id: notifcation.referenceId ?? '_' },
          });

    _.set(notifcation, 'reference', reference);
  }

  async getNotificationById(query: SearchNotificationDto, user: IdentityUser) {
    const notifcation = await this.prisma.notification.findUnique({
      select: notificationSelect,
      where: { id: query.id },
    });

    if (notifcation.targetUser.id !== user.id) {
      throw new AppError.NotFound(messages.error.notFoundEntity).setParams({
        entity: 'Notifcation',
        id: query.id,
      });
    }

    await this.linkReference(notifcation);

    return notifcation;
  }

  async getNotifications(query: SearchNotificationsDto, user: IdentityUser) {
    const notifications = await this.prisma.notification.findMany({
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      where: {
        targetUserId: user.id,
        id: query.excludeIds?.length ? { notIn: query.excludeIds } : undefined,
      },
      take: query.take,
    });

    return Promise.all(
      notifications.map(async (notification) => {
        await this.linkReference(notification);
        return notification;
      }),
    );
  }

  async createNotification(dto: CreateNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_EVENTS.NOTIFICATION_EVENTS.CREATE_NOTIFICATION,
      { ...dto, sourceUserId: user.id },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async updateNotification(dto: UpdateNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_EVENTS.NOTIFICATION_EVENTS.UPDATE_NOTIFICATION,
      { ...dto, targetUserId: user.id },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async deleteNotification(dto: DeleteNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_EVENTS.NOTIFICATION_EVENTS.DELETE_NOTIFICATION,
      { ...dto, targetUserId: user.id },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  prepareMessageNotifications(
    message: Awaited<ReturnType<RoomsService['createMessage']>>,
    socketUsers: Array<ISocketUser>,
    user: IdentityUser,
  ) {
    const code = 'notification:message';

    return Promise.all(
      socketUsers.map(async (socketUser) => {
        const dto: CreateNotificationDto = {
          entity: 'RoomMessage',
          referenceId: message.id,
          targetUserId: socketUser.userId,
          code,
          params: Prisma.JsonNull,
          status:
            user.id === socketUser.userId
              ? NotificationStatus.Viewed
              : socketUser.type === 'unconnected'
                ? NotificationStatus.Queued
                : NotificationStatus.Sent,
        };

        return this.createNotification(dto, user);
      }),
    );
  }
}
