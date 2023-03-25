import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcrypt';
import * as moment from 'moment';
import { AppError, messages } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { UsersService } from 'src/users/users.service';
import { VerificationTokensService } from 'src/verification-tokens/verification-tokens.service';

import { ForgotPasswordDto, RegisterDto, ResetPasswordDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sendgridService: SendgridService,
    private usersService: UsersService,
    private verificationTokensService: VerificationTokensService,
  ) {}

  async hashPassword(password: string) {
    const salt = await genSalt(10);
    return hash(password, salt);
  }

  async register(dto: RegisterDto) {
    const hashPassword = await this.hashPassword(dto.password);

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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByUnique({
      username: dto.username,
    });

    if (!user || !user.email) {
      throw new AppError.Argument(
        'Not found username or account not have an email.',
      );
    }

    const { token } = await this.verificationTokensService.generateToken(
      user.id,
    );

    const from = this.sendgridService.sender;
    const to = user.email;
    const resetLink = new URL(
      this.configService.get<string>('RESET_PASSWORD_URL'),
    );
    resetLink.searchParams.set('token', token);

    const html = await this.sendgridService.renderTemplate('forgot-password', {
      username: user.username,
      resetLink: resetLink.toString(),
      userEmail: to,
      supportEmail: from,
    });

    await this.sendgridService.send({
      subject: 'Forgot Password?',
      from: from,
      to: to,
      html,
    });

    return { email: user.email };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verificationToken =
      await this.verificationTokensService.getTokenActive(dto.token);

    const hashPassword = await this.hashPassword(dto.password);

    const user = await this.prisma.user.update({
      data: {
        password: hashPassword,
      },
      where: {
        id: verificationToken.userId,
      },
    });

    await this.verificationTokensService.revokeToken(dto.token);

    return { username: user.username };
  }

  async generateAccessToken(
    user: Awaited<ReturnType<UsersService['findByUnique']>>,
  ): Promise<string> {
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
            this.configService.get<number>('REFRESH_TOKEN_EXPIRES') || 2592000,
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

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUnique({ username });
    if (user && (await compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(
    user: Awaited<ReturnType<UsersService['findByUnique']>>,
    ipAddress: string,
  ) {
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
        throw new AppError.NotFound();
      }

      if (
        oldRefreshToken.revoked ||
        moment(oldRefreshToken.expires).isSameOrBefore()
      ) {
        throw new AppError.Argument(messages.InvalidRefreshToken);
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
        throw new AppError.NotFound();
      }

      if (refreshToken.userId !== userId) {
        throw new AppError.Argument(messages.InvalidRefreshToken);
      }

      if (
        refreshToken.revoked ||
        moment(refreshToken.expires).isSameOrBefore()
      ) {
        throw new AppError.Argument(messages.InvalidRefreshToken);
      }

      await this.revokeRefreshToken(refreshToken.id, ip);
    });
  }
}
