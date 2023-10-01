import { GraphService } from '@akiratatsuhisa/sawamura-graph-module';
import { messages } from '@akiratatsuhisa/sawamura-utils';
import { Injectable } from '@nestjs/common';
import { WhinnyReactionKind, WhinnyType } from '@prisma/client';
import _ from 'lodash';
import { IdentityUser } from 'src/auth/identity.class';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateWhinnyDto,
  DeleteWhinnyDto,
  SearchWhinniesDto,
  SearchWhinnyDto,
  SearchWhinnyReactionsDto,
  UpdateWhinnyReactionDto,
} from './dtos';
import { whinnyReactionSelect, whinnySelect } from './whinnies.factory';

@Injectable()
export class WhinniesService {
  constructor(
    private prisma: PrismaService,
    private graphService: GraphService,
  ) {}

  private async mapWhinnyWithCounts<T extends Record<string, any>>(
    whinnyId: string,
    whinny: T,
    user: IdentityUser,
  ) {
    const [countReactions, countComments, countQuotes, reaction, repostUrlId] =
      await Promise.all([
        this.prisma.whinnyReaction.count({ where: { whinnyId } }),
        this.prisma.whinny.count({
          where: { sourceId: whinnyId, type: WhinnyType.Comment },
        }),
        this.prisma.whinny.count({
          where: {
            sourceId: whinnyId,
            type: { in: [WhinnyType.Repost, WhinnyType.Quote] },
          },
        }),
        this.prisma.whinnyReaction.count({
          where: { whinnyId: whinnyId, userId: user.id },
        }),
        this.prisma.whinny
          .findFirst({
            select: {
              urlId: true,
            },
            where: {
              sourceId: whinnyId,
              userId: user.id,
              type: WhinnyType.Repost,
            },
          })
          .then((value) => value?.urlId),
      ]);

    return {
      ...whinny,
      countReactions,
      countComments,
      countQuotes,
      hasReaction: !!reaction,
      repostUrlId,
    };
  }

  async getFeeds(_user: IdentityUser) {
    return [];
  }

  async getAll(dto: SearchWhinniesDto, user: IdentityUser) {
    const whinnies = await this.prisma.whinny.findMany({
      select: whinnySelect,
      where: {
        sourceId: _.isEmpty(dto.sourceId) ? undefined : dto.sourceId,
        type: dto.sourceId ? WhinnyType.Comment : { not: WhinnyType.Comment },
        user: !_.isEmpty(dto.sourceId) ? undefined : { username: dto.username },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...PaginationService.makePaginationCursor(dto),
    });

    return Promise.all(
      _.map(whinnies, async (whinny) =>
        this.mapWhinnyWithCounts(
          whinny.type === WhinnyType.Repost ? whinny.source.id : whinny.id,
          whinny,
          user,
        ),
      ),
    );
  }

  async getById(dto: SearchWhinnyDto, user: IdentityUser) {
    const whinny = await this.prisma.whinny.findUnique({
      select: whinnySelect,
      where: {
        urlId: BigInt(dto.urlId),
      },
    });
    return this.mapWhinnyWithCounts(
      whinny.type === WhinnyType.Repost ? whinny.source.id : whinny.id,
      whinny,
      user,
    );
  }

  async create(dto: CreateWhinnyDto, user: IdentityUser) {
    if (dto.sourceId) {
      const source = await this.prisma.whinny.findFirstOrThrow({
        select: {
          id: true,
          type: true,
          _count: {
            select: {
              whinnies: { where: { type: WhinnyType.Repost, userId: user.id } },
            },
          },
        },
        where: { id: dto.sourceId },
      });

      if (
        source.type === WhinnyType.Repost ||
        (dto.type === WhinnyType.Repost && source._count.whinnies)
      ) {
        throw new AppError.Argument(messages.warning.invalidRepostRequest);
      }
    }

    const whinny = await this.prisma.whinny.create({
      select: whinnySelect,
      data: {
        userId: user.id,
        sourceId: dto.type === WhinnyType.Owner ? undefined : dto.sourceId,
        type: dto.type,
        content: dto.type === WhinnyType.Repost ? undefined : dto.content,
        publishDate:
          dto.type !== WhinnyType.Owner ? undefined : dto.publishDate,
      },
    });

    this.graphService.silentCall(async () => {
      const user = await this.prisma.user.findUnique({
        select: {
          id: true,
          username: true,
          displayName: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
        where: { id: whinny.user.id },
      });

      if (dto.type === WhinnyType.Repost) {
        await this.graphService.whinny.upsertRepost({
          id: whinny.source.id,
          whinny: {
            urlId: whinny.source.urlId.toString(),
            ..._.pick(whinny.source, [
              'content',
              'publishDate',
              'createdAt',
              'updatedAt',
            ]),
          },
          userId: user.id,
          user,
        });
      } else {
        await this.graphService.whinny.upsert({
          id: whinny.id,
          whinny: {
            urlId: whinny.urlId.toString(),
            ..._.pick(whinny, [
              'content',
              'publishDate',
              'createdAt',
              'updatedAt',
            ]),
          },
          userId: user.id,
          user,
          type:
            dto.type === WhinnyType.Comment || dto.type === WhinnyType.Quote
              ? dto.type === WhinnyType.Comment
                ? 'comment'
                : 'quote'
              : undefined,
          sourceId: whinny.source?.id,
          source: {
            urlId: whinny.source?.urlId.toString(),
            ..._.pick(whinny.source, [
              'content',
              'publishDate',
              'createdAt',
              'updatedAt',
            ]),
          },
        });
      }
    });

    return this.mapWhinnyWithCounts(
      whinny.type === WhinnyType.Repost ? whinny.source.id : whinny.id,
      whinny,
      user,
    );
  }

  async delete(dto: DeleteWhinnyDto, user: IdentityUser) {
    const whinny = await this.prisma.whinny.findUnique({
      select: { id: true, userId: true },
      where: { urlId: BigInt(dto.urlId) },
    });

    if (!whinny) {
      throw new AppError.NotFound();
    }

    if (whinny.userId !== user.id) {
      throw new AppError.AccessDenied();
    }

    await this.prisma.whinny.delete({
      where: { id: whinny.id },
    });
    this.graphService.silentCall(() =>
      this.graphService.whinny.delete(whinny.id),
    );
  }

  async getReactions(dto: SearchWhinnyReactionsDto) {
    const whinny = await this.prisma.whinny.findUnique({
      select: { id: true, type: true },
      where: { urlId: BigInt(dto.urlId) },
    });

    if (!whinny) {
      throw new AppError.NotFound();
    }

    if (whinny.type === WhinnyType.Repost) {
      throw new AppError.Argument(messages.warning.invalidRepostRequest);
    }

    return this.prisma.whinnyReaction.findMany({
      select: whinnyReactionSelect,
      where: {
        whinny: {
          urlId: BigInt(dto.urlId),
        },
      },
      ...PaginationService.makePaginationCursor(dto),
    });
  }

  async react(dto: UpdateWhinnyReactionDto, user: IdentityUser) {
    const whinny = await this.prisma.whinny.findUnique({
      select: { id: true, type: true },
      where: { urlId: BigInt(dto.urlId) },
    });

    if (!whinny) {
      throw new AppError.NotFound();
    }

    if (whinny.type === WhinnyType.Repost) {
      throw new AppError.Argument(messages.warning.invalidRepostRequest);
    }

    if (dto.kind === WhinnyReactionKind.None) {
      await this.prisma.whinnyReaction.deleteMany({
        where: { whinny: { urlId: BigInt(dto.urlId) }, userId: user.id },
      });
      this.graphService.silentCall(() =>
        this.graphService.whinny.deleteReaction({
          whinnyId: whinny.id,
          userId: user.id,
        }),
      );
      return;
    }

    const whinnyReaction = await this.prisma.whinnyReaction.create({
      data: {
        whinnyId: whinny.id,
        userId: user.id,
        kind: dto.kind,
      },
    });
    this.graphService.silentCall(() =>
      this.graphService.whinny.upsertReaction({
        whinnyId: whinny.id,
        userId: user.id,
        whinnyReactionId: whinnyReaction.id,
        whinnyReaction: _.pick(whinnyReaction, [
          'kind',
          'icon',
          'createdAt',
          'updatedAt',
        ]),
      }),
    );
  }
}
