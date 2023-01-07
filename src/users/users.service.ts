import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { UserWithRoles } from './types/UserWithRoles.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Array<UserWithRoles>> {
    return this.prisma.user.findMany({
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findByUnique(
    idOrUsername: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithRoles> {
    return this.prisma.user.findUnique({
      where: idOrUsername,
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findByRefreshToken(token: string): Promise<UserWithRoles> {
    return this.prisma.user.findFirst({
      where: { refreshTokens: { some: { token } } },
      include: { userRoles: { include: { role: true } } },
    });
  }
}
