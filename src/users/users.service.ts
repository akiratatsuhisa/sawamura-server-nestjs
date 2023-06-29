import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { SearchUsersDto } from './dtos';
import { userProfileSelect, userSelect } from './users.factory';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
