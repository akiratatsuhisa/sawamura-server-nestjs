import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import _ from 'lodash';
import { SECURITY_STAMPS_REDIS_KEY } from 'src/auth/constants';
import { IdentityUser } from 'src/auth/decorators';
import { EmailState, makeHasState, SearchMatch } from 'src/common/enum';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { Security } from 'src/helpers/security.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

import {
  ChangeUserRelationshipDto,
  ChangeUserRolesDto,
  SearchAdvancedUsersDto,
  SearchUsersDto,
  UserRelationshipState,
} from './dtos';
import {
  userAdvancedSelect,
  userDetailSelect,
  userProfileSelect,
  userSelect,
} from './users.factory';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async searchAdvanced(dto: SearchAdvancedUsersDto) {
    return this.prisma.user.findMany({
      select: userAdvancedSelect,
      where: {
        OR: dto.search
          ? [
              { username: { contains: dto.search } },
              { displayName: { contains: dto.search } },
              { firstName: { contains: dto.search } },
              { lastName: { contains: dto.search } },
            ]
          : undefined,
      },
    });
  }

  async searchProfileUnique(idOrUsername: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      select: userProfileSelect,
      where: idOrUsername,
    });
  }

  async isFollowingUser(
    idOrUsername: Prisma.UserWhereUniqueInput,
    user: IdentityUser,
  ) {
    const count = await this.prisma.relationship.count({
      where: { follower: { id: user.id }, followee: idOrUsername },
    });
    return !!count;
  }

  async changeRelationship(dto: ChangeUserRelationshipDto, user: IdentityUser) {
    if (dto.username === user.username) {
      throw new AppError.BadDto();
    }

    const followee = await this.prisma.user.findUnique({
      select: { id: true },
      where: { username: dto.username },
    });
    if (!followee) {
      return new AppError.BadDto();
    }

    const follower = user;
    const relation = await this.prisma.relationship.findUnique({
      select: { id: true },
      where: {
        followerId_followeeId: {
          followerId: follower.id,
          followeeId: followee.id,
        },
      },
    });

    if (
      (relation && dto.relationshipState === UserRelationshipState.Follow) ||
      (!relation && dto.relationshipState === UserRelationshipState.Unfollow)
    ) {
      throw new AppError.BadDto();
    }

    if (dto.relationshipState === UserRelationshipState.Unfollow) {
      await this.prisma.relationship.delete({ where: { id: relation.id } });
    } else {
      await this.prisma.relationship.create({
        data: { followerId: follower.id, followeeId: followee.id },
      });
    }
  }

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
