import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import _ from 'lodash';
import { IdentityUser } from 'src/auth/decorators';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { AUTH_CONTANTS } from 'src/constants';
import { DropboxService } from 'src/dropbox/dropbox.service';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  ChangeUserRelationshipDto,
  SearchAdvancedUsersDto,
  SearchUserImageDto,
  SearchUserRelationshipDto,
  SearchUserRelationshipType,
  UserRelationshipState,
} from './dtos';
import {
  profileUserRelationSelect,
  profileUserSelect,
  userAdvancedSelect,
} from './profile-users.factory';

@Injectable()
export class ProfileUsersService {
  constructor(
    private prisma: PrismaService,
    private dropboxService: DropboxService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      select: profileUserSelect,
      where: idOrUsername,
    });
  }

  async getImageLink(dto: SearchUserImageDto) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const user = await this.searchProfileUnique({
      username: dto.username,
    });

    if (!user) {
      throw new AppError.NotFound();
    }

    return this.cacheManager.wrap(
      `user:${dto.username}:${dto.type}`,
      () => this.dropboxService.getTemporaryLink(user[fieldName]),
      AUTH_CONTANTS.CACHE_TIME,
    );
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

  private async mapRelationshipsAsUserWithState(
    relationshipsAsUser: Array<{
      id: string;
      user: {
        id: string;
        username: string;
        displayName: string;
        biography: string;
        photoUrl: string;
      };
    }>,
    identityUser: IdentityUser,
  ) {
    const followingUserIds = _.map(
      await this.prisma.relationship.findMany({
        select: { followeeId: true },
        where: {
          followerId: identityUser.id,
          followeeId: {
            in: _.map(relationshipsAsUser, ({ user }) => user.id),
          },
        },
      }),
      'followeeId',
    );

    return _.map(relationshipsAsUser, ({ id, user }) => ({
      id,
      user,
      state:
        user.id === identityUser.id
          ? 'none'
          : _.some(followingUserIds, (id) => id === user.id)
          ? 'following'
          : 'noFollow',
    }));
  }

  async searchRelationships(
    dto: SearchUserRelationshipDto,
    user: IdentityUser,
  ) {
    const where: Prisma.RelationshipWhereInput =
      dto.type === SearchUserRelationshipType.Following
        ? {
            follower: { username: dto.username },
          }
        : dto.type === SearchUserRelationshipType.Followers
        ? {
            followee: { username: dto.username },
          }
        : {
            follower: {
              followees: {
                some: {
                  followerId: user.id,
                },
              },
            },
            followee: {
              username: dto.username,
            },
          };

    const relationships = await this.prisma.relationship.findMany({
      select: profileUserRelationSelect,
      where,
      orderBy: { createdAt: 'desc' },
      ...PaginationService.makePaginationCursor(dto),
    });

    const relationsAsUser = _.map(relationships, (relationship) => ({
      id: relationship.id,
      user:
        dto.type === SearchUserRelationshipType.Following
          ? relationship.followee
          : relationship.follower,
    }));

    return this.mapRelationshipsAsUserWithState(relationsAsUser, user);
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
}
