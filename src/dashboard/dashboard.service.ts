import { Injectable } from '@nestjs/common';
import { RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import * as moment from 'moment';
import { AppError } from 'src/common/errors';
import { DropboxService } from 'src/dropbox/dropbox.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from 'src/rooms/rooms.service';

import { REDIS_DASHBOARD_KEYS } from './constants';
import { SearchChartMessagesDto } from './dtos';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private roomsService: RoomsService,
    private dropboxService: DropboxService,
  ) {}

  async getDropboxSpaceUsage() {
    const cache = await this.redisService.db.get(
      REDIS_DASHBOARD_KEYS.STORAGE_DROPBOX,
    );

    if (cache) {
      return JSON.parse(cache) as Awaited<
        ReturnType<DropboxService['getSpaceUsage']>
      >;
    }

    const result = await this.dropboxService.getSpaceUsage();

    await this.redisService.db.set(
      REDIS_DASHBOARD_KEYS.STORAGE_DROPBOX,
      JSON.stringify(result),
      {
        EX: REDIS_DASHBOARD_KEYS.STORAGE_DROPBOX_CACHE_SECONDS,
      },
    );
    return result;
  }

  async countUsers() {
    return { count: await this.prisma.user.count() };
  }

  async chartMessages(dto: SearchChartMessagesDto) {
    const fromDate = moment(dto.fromDate).startOf('date');
    const toDate = moment(dto.toDate).endOf('date');

    if (fromDate.isAfter(toDate)) {
      throw new AppError.Argument(AppError.Messages.InvalidDateFromTo);
    }

    const messages = await this.prisma.roomMessage.findMany({
      select: {
        type: true,
        content: true,
        createdAt: true,
      },
      where: {
        type: { not: RoomMessageType.None },
        createdAt: {
          gte: fromDate.toDate(),
          lte: toDate.toDate(),
        },
      },
    });

    const messagesGroupByMonth = _.groupBy(messages, ({ createdAt }) =>
      moment(createdAt).format('YYYY-MM'),
    );

    const startDate = fromDate.clone().startOf('month');
    const stopDate = toDate.clone().startOf('month');

    const months = [startDate];

    while (_.last(months).isBefore(stopDate)) {
      months.push(startDate.clone().add(months.length, 'months'));
    }

    return _.map(months, (date) => {
      const [dataFiles, dataMessages] = _.partition(
        messagesGroupByMonth[date.format('YYYY-MM')],
        ({ type }) => this.roomsService.isRoomMessageFileTypes(type),
      );

      const countFiles = _.reduce(
        dataFiles,
        (count, data) => {
          if (!_.isArray(data.content) || !data.content.length) {
            return count;
          }
          const length = _(data.content)
            .filter(
              (o) =>
                _.isObject(o) &&
                typeof (o as any).pathDisplay === 'string' &&
                (o as any).pathDisplay != '',
            )
            .value().length;

          return count + length;
        },
        0,
      );

      return {
        label: date.format('YYYY-MM'),
        value: date.valueOf(),
        countMessages: dataMessages.length,
        countFiles,
      };
    }).reverse();
  }

  async chartUserRoles() {
    const roles = await this.prisma.role.findMany({
      select: {
        name: true,
        userRoles: { select: { id: true } },
      },
    });

    return _.map(roles, (role) => ({
      name: role.name,
      count: role.userRoles.length,
    }));
  }
}
