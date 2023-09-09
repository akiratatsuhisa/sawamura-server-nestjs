import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import _ from 'lodash';
import { SECURITY_STAMPS_REDIS_KEY } from 'src/auth/constants';
import { EmailState, makeHasState, SearchMatch } from 'src/common/enum';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { Security } from 'src/helpers/security.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

import { ChangeUserRolesDto, SearchUsersDto } from './dtos';
import { userDetailSelect, userSelect } from './users.factory';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(dto: SearchUsersDto) {
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
      if (dto.roleMode === SearchMatch.All) {
        _.forEach(dto.roleIds, (roleId) => {
          AND.push({ userRoles: { some: { roleId } } });
        });
      } else {
        AND.push({
          userRoles: {
            some: { roleId: { in: dto.roleIds } },
          },
        });
      }
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
        select: userSelect,
        where: { AND },
        ...PaginationService.makePaginationOffset(dto),
        orderBy: { [dto.sort.field]: dto.sort.order },
      }),
      this.prisma.user.count({ where: { AND } }),
    ]);

    return { records, count: records.length, totalCount };
  }

  async findByUnique(idOrUsername: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      select: userSelect,
      where: idOrUsername,
    });
  }

  async findByUniqueWithDetail(idOrUsername: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      select: userDetailSelect,
      where: idOrUsername,
    });
  }

  async changeRoles(dto: ChangeUserRolesDto) {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        securityStamp: true,
        userRoles: { select: { roleId: true } },
      },
      where: { id: dto.id },
    });
    if (!user) {
      throw new AppError.NotFound();
    }

    const roleCount = await this.prisma.role.count({
      where: { id: { in: dto.roleIds } },
    });
    if (roleCount !== dto.roleIds.length) {
      throw new AppError.Argument(AppError.Messages.InvalidChangeUserRoles);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: user.id, roleId: { notIn: dto.roleIds } },
      });
      await tx.userRole.createMany({
        data: _(dto.roleIds)
          .difference(_.map(user.userRoles, 'roleId'))
          .map((roleId) => ({ userId: user.id, roleId }))
          .value(),
      });

      await this.redisService.db.zRem(
        SECURITY_STAMPS_REDIS_KEY,
        user.securityStamp,
      );
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: { securityStamp: Security.generateSecurityStamp() },
      });
    });
  }

  async findByProvider(provider: string, sub: string) {
    const userLogin = await this.prisma.userLogins.findUnique({
      select: { user: { select: userDetailSelect } },
      where: {
        providerName_providerKey: { providerName: provider, providerKey: sub },
      },
    });

    return !userLogin ? null : userLogin.user;
  }

  async findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({
      where: { refreshTokens: { some: { token } } },
      select: userDetailSelect,
    });
  }
}
