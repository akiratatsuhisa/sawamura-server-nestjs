import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { SearchUsersDto } from './dtos';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  private userSelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    username: true,
    password: true,
    email: true,
    firstName: true,
    lastName: true,
    birthDate: true,
    salary: true,
    photoUrl: true,
    coverUrl: true,
    createdAt: true,
    updatedAt: true,
    userRoles: {
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    },
  });

  async findAll(dto: SearchUsersDto) {
    return this.prisma.user.findMany({
      select: this.userSelect,
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
      select: this.userSelect,
      where: idOrUsername,
    });
  }

  async findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({
      where: { refreshTokens: { some: { token } } },
      select: this.userSelect,
    });
  }
}
