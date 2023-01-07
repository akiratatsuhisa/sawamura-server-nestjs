import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcrypt';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserWithRoles } from 'src/users/types/UserWithRoles.type';
import { UsersService } from 'src/users/users.service';

import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async generateAccessToken(user: UserWithRoles): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      salary: user.salary,
      roles: user.userRoles.map((userRole) => userRole.role.name),
    };

    return this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(
    userId: string,
    ipAddress: string,
  ): Promise<string> {
    const { token } = await this.prisma.refreshToken.create({
      data: {
        expires: moment()
          .add(
            this.config.get<number>('REFRESH_TOKEN_EXPIRES') || 2592000,
            'seconds',
          )
          .toDate(),
        userId,
        createdByIp: ipAddress,
      },
      select: {
        token: true,
      },
    });

    return token;
  }

  async revokeRefreshToken(
    id: string,
    ipAddress: string,
    replaceToken?: string,
  ): Promise<Date> {
    const { revoked } = await this.prisma.refreshToken.update({
      data: {
        revoked: moment().toDate(),
        revokedByIp: ipAddress,
        replaceByToken: replaceToken,
      },
      where: { id },
      select: {
        revoked: true,
      },
    });

    return revoked;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithRoles> {
    const user = await this.usersService.findByUnique({ username });
    if (user && (await compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(dto: RegisterDto) {
    const salt = await genSalt(10);
    const hashPassword = await hash(dto.password, salt);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashPassword,
        userRoles: {
          create: [
            {
              role: {
                connect: { name: 'User' },
              },
            },
          ],
        },
      },
      select: {
        id: true,
        username: true,
      },
    });
  }

  async login(user: UserWithRoles, ipAddress: string) {
    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user.id, ipAddress),
    };
  }

  async refreshToken(token: string, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const { user, ...oldRefreshToken } = await tx.refreshToken.findFirst({
        where: { token },
        include: {
          user: {
            include: { userRoles: { include: { role: true } } },
          },
        },
      });

      if (!oldRefreshToken) {
        throw new NotFoundException(`refreshToken = ${token}`);
      }

      if (
        oldRefreshToken.revoked ||
        moment(oldRefreshToken.expires).isSameOrBefore()
      ) {
        throw new BadRequestException('RefreshToken is inactive.');
      }

      const accessToken = await this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user.id, ip);
      await this.revokeRefreshToken(oldRefreshToken.id, ip, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  async revoke(token: string, userId: string, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const refreshToken = await tx.refreshToken.findFirst({
        where: { token },
      });

      if (!refreshToken) {
        throw new NotFoundException(`refreshToken = ${token}`);
      }

      if (refreshToken.userId !== userId) {
        throw new BadRequestException('Invalid RefreshToken owner.');
      }

      if (
        refreshToken.revoked ||
        moment(refreshToken.expires).isSameOrBefore()
      ) {
        throw new BadRequestException('RefreshToken is inactive.');
      }

      await this.revokeRefreshToken(refreshToken.id, ip);
    });
  }
}
