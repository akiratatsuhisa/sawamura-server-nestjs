import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { Queue } from 'bull';
import * as _ from 'lodash';
import { IdentityUser } from 'src/auth/identity.class';
import { AppError } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { ISocketUser } from 'src/ws-auth/interfaces/send-to-options.interface';

import { NAME, SOCKET_NOTIFICATION_EVENTS } from './constants';
import {
  CreateNotificationDto,
  DeleteNotificationDto,
  SearchNotificationDto,
  SearchNotificationsDto,
  UpdateNotificationDto,
} from './dtos';
import { notificationSelect } from './notifcations.type';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(NAME) private notificationsQueue: Queue,
  ) {}

  async getNotificationById(query: SearchNotificationDto, user: IdentityUser) {
    const notifcation = await this.prisma.notification.findUnique({
      select: notificationSelect,
      where: { id: query.id },
    });

    if (notifcation.targetUser.id !== user.id) {
      throw new AppError.NotFound();
    }

    return notifcation;
  }

  async getNotifications(query: SearchNotificationsDto, user: IdentityUser) {
    return this.prisma.notification.findMany({
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      where: {
        targetUserId: user.id,
        id: query.excludeIds?.length ? { notIn: query.excludeIds } : undefined,
      },
      take: query.take,
    });
  }

  async createNotification(dto: CreateNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_NOTIFICATION_EVENTS.CREATE_NOTIFICATION,
      { ...dto, sourceUserId: user.id },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async updateNotification(dto: UpdateNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_NOTIFICATION_EVENTS.UPDATE_NOTIFICATION,
      { ...dto, targetUserId: user.id },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async deleteNotification(dto: DeleteNotificationDto, user: IdentityUser) {
    return this.notificationsQueue.add(
      SOCKET_NOTIFICATION_EVENTS.DELETE_NOTIFICATION,
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

    const params = {
      fromUsername: message.user.username,
      content: _.truncate(
        typeof message.content === 'string' ? message.content : 'file',
        { length: 24 },
      ),
    };

    return Promise.all(
      socketUsers.map(async (socketUser) => {
        const dto: CreateNotificationDto = {
          entity: 'RoomMessage',
          referenceId: message.id,
          targetUserId: socketUser.userId,
          code,
          params,
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
