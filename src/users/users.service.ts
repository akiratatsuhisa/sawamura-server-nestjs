import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import _ from 'lodash';
import { EmailState, makeHasState } from 'src/common/enum';
import { PaginationService } from 'src/common/services';
import { PrismaService } from 'src/prisma/prisma.service';

import { SearchAdvancedUsersDto, SearchUsersDto } from './dtos';
import {
  userAdvancedSelect,
  userProfileSelect,
  userSelect,
} from './users.factory';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchAdvanced(dto: SearchAdvancedUsersDto) {
    const AND: Array<Prisma.UserWhereInput> = [];

    if (!_.isNil(dto.username)) {
      AND.push({ username: { contains: dto.username } });
    }

    if (!_.isNil(dto.name)) {
      AND.push({
        OR: [
          { firstName: { contains: dto.name } },
          { lastName: { contains: dto.name } },
        ],
      });
    }

    if (!_.isNil(dto.roleIds)) {
      AND.push({
        userRoles: {
          some: { roleId: { in: dto.roleIds } },
        },
      });
    }

    if (!_.isNil(dto.emailStates)) {
      const OR: Array<Prisma.UserWhereInput> = [];
      const hasState = makeHasState(dto.emailStates);

      if (hasState(EmailState.None)) {
        OR.push({ email: { equals: null } });
      }
      if (hasState(EmailState.Verified)) {
        OR.push({ email: { not: null }, emailConfirmed: true });
      }
      if (hasState(EmailState.Unverified)) {
        OR.push({ email: { not: null }, emailConfirmed: false });
      }

      AND.push(OR.length ? { OR } : { id: null });
    }

    if (!_.isNil(dto.email)) {
      AND.push({ email: { contains: dto.email } });
    }

    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: userAdvancedSelect,
        where: { AND },
        ...PaginationService.makePaginationOffset(dto),
        orderBy: { [dto.sort.field]: dto.sort.order },
      }),
      this.prisma.user.count({ where: { AND } }),
    ]);

    return { records, count: records.length, totalCount };
  }

  async findAll(dto: SearchUsersDto) {
    return this.prisma.user.findMany({
      select: userSelect,
      where: {
        OR: dto.search
          ? [
              { username: { contains: dto.search } },
              { firstName: { contains: dto.search } },
              { lastName: { contains: dto.search } },
            ]
          : undefined,
      },
    });
  }

  async findByUnique(idOrUsername: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      select: userSelect,
      where: idOrUsername,
    });
  }

  async findByUniqueWithDetail(idOrUsername: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      select: userProfileSelect,
      where: idOrUsername,
    });
  }

  async findByProvider(provider: string, sub: string) {
    const userLogin = await this.prisma.userLogins.findUnique({
      select: { user: { select: userProfileSelect } },
      where: {
        providerName_providerKey: { providerName: provider, providerKey: sub },
      },
    });

    return !userLogin ? null : userLogin.user;
  }

  async findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({
      where: { refreshTokens: { some: { token } } },
      select: userProfileSelect,
    });
  }
}
