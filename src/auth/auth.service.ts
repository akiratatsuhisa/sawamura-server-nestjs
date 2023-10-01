import { GraphService } from '@akiratatsuhisa/sawamura-graph-module';
import { messages } from '@akiratatsuhisa/sawamura-utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { VerificationTokenType } from '@prisma/client';
import { compare, genSalt, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import _ from 'lodash';
import moment from 'moment';
import { AppError } from 'src/common/errors';
import { AuthFile } from 'src/constants';
import { DropboxService } from 'src/dropbox/dropbox.service';
import { FileUtilsService } from 'src/file-utils/file-utils.service';
import { IFile } from 'src/helpers';
import { MaterialDesignService } from 'src/material-design/material-design.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { UsersService } from 'src/users/users.service';
import { Random } from 'src/utils';
import { VerificationTokensService } from 'src/verification-tokens/verification-tokens.service';

import { SECURITY_STAMPS_REDIS_KEY } from './constants';
import { IdentityUser } from './decorators';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  RegisterDto,
  ResetPasswordDto,
  SearchImageDto,
  UpdateEmailDto,
  UpdateImageDto,
  UpdatePasswordDto,
  UpdateThemeDto,
} from './dtos';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private redisService: RedisService,
    private graphService: GraphService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sendgridService: SendgridService,
    private dropboxService: DropboxService,
    private fileUtilsService: FileUtilsService,
    private materialDesignService: MaterialDesignService,
    private usersService: UsersService,
    private verificationTokensService: VerificationTokensService,
  ) {}

  async updateSecurityStamp(
    userOrUserId: string | { id: string; securityStamp: string },
  ) {
    const { securityStamp } =
      typeof userOrUserId === 'string'
        ? await this.prisma.user.findUniqueOrThrow({
            where: { id: userOrUserId },
            select: { securityStamp: true },
          })
        : userOrUserId;

    await this.redisService.db.zRem(SECURITY_STAMPS_REDIS_KEY, securityStamp);

    await this.prisma.user.update({
      where: {
        id: typeof userOrUserId === 'string' ? userOrUserId : userOrUserId.id,
      },
      data: { securityStamp: Random.generateSecurityStamp() },
      select: { id: true },
    });
  }

  async verifySecurityStamp(securityStamp: string) {
    const score = await this.redisService.db.zScore(
      SECURITY_STAMPS_REDIS_KEY,
      securityStamp,
    );

    if (score !== null) {
      return true;
    }

    const count = await this.prisma.user.count({
      where: { securityStamp },
    });

    if (count) {
      await this.redisService.db.zAdd(SECURITY_STAMPS_REDIS_KEY, {
        value: securityStamp,
        score: moment().add(15, 'minutes').unix(),
      });
    }

    return count === 1;
  }

  @Cron('0 */30 * * * *')
  async taskSecurityStamp() {
    const score = moment().unix();

    await this.redisService.db.zRemRangeByScore(
      SECURITY_STAMPS_REDIS_KEY,
      '-inf',
      `(${score}`,
    );
  }

  async sendConfirmEmail(user: {
    id: string;
    username: string;
    email: string;
  }) {
    const expires = moment().add(7, 'days');

    const { token } = await this.verificationTokensService.generateToken(
      user.id,
      VerificationTokenType.VerifyEmail,
      expires.toDate(),
    );

    const to = user.email;
    const from = this.sendgridService.sender;

    const confirmationLink = new URL(
      this.configService.get<string>('CONFIRM_EMAIL_URL'),
    );
    confirmationLink.searchParams.set('token', token);

    const html = await this.sendgridService.renderTemplate('confirm-email', {
      username: user.username,
      expires: expires.utc().format('YYYY-MM-DD HH:mm:ss'),
      confirmationLink: confirmationLink.toString(),
      userEmail: to,
      supportEmail: from,
    });

    await this.sendgridService.send({
      subject: 'Confirm Email!',
      from: from,
      to: to,
      html,
    });
  }

  async hashPassword(password: string) {
    const salt = await genSalt(10);
    return hash(password, salt);
  }

  async register(dto: RegisterDto) {
    const hashPassword = await this.hashPassword(dto.password);

    const result = await this.prisma.user.create({
      data: {
        username: dto.username,
        displayName: dto.displayName,
        email: dto.email,
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
        securityStamp: Random.generateSecurityStamp(),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (dto.email) {
      await this.sendConfirmEmail(result);
    }
    this.logger.log(`[Register]:${result.username}`);

    this.graphService.silentCall(() =>
      this.graphService.user.upsert(
        result.id,
        _.pick(result, ['username', 'displayName', 'createdAt', 'updatedAt']),
      ),
    );
    return result;
  }

  async deleteAccount(user: IdentityUser) {
    await this.prisma.room.deleteMany({
      where: { isGroup: false, roomMembers: { some: { memberId: user.id } } },
    });

    await this.prisma.user.delete({ where: { id: user.id } });
    this.logger.warn(`[DeleteAccount]:${user.username}`);

    this.graphService.silentCall(() => this.graphService.user.delete(user.id));
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const verificationToken =
      await this.verificationTokensService.getTokenActive(
        dto.token,
        VerificationTokenType.VerifyEmail,
      );

    const user = await this.prisma.user.update({
      data: {
        emailConfirmed: true,
      },
      where: {
        id: verificationToken.userId,
      },
    });

    await this.verificationTokensService.revokeToken(
      dto.token,
      VerificationTokenType.VerifyEmail,
    );
    this.logger.log(`[ConfirmEmail]:${user.username}`);

    return { username: user.username };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByUniqueWithDetail({
      username: dto.username,
    });

    if (!user || !user.emailConfirmed) {
      throw new AppError.Argument(messages.error.forgotPassword);
    }

    const { token } = await this.verificationTokensService.generateToken(
      user.id,
      VerificationTokenType.ResetPassword,
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
    this.logger.log(`[ForgotPassword]:${user.username}`);

    return { email: user.email };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const [verificationToken, hashPassword] = await Promise.all([
      this.verificationTokensService.getTokenActive(
        dto.token,
        VerificationTokenType.ResetPassword,
      ),
      this.hashPassword(dto.password),
    ]);

    const user = await this.prisma.user.update({
      data: {
        password: hashPassword,
      },
      where: {
        id: verificationToken.userId,
      },
    });

    await Promise.all([
      this.updateSecurityStamp(user),
      this.verificationTokensService.revokeToken(
        dto.token,
        VerificationTokenType.ResetPassword,
      ),
    ]);
    this.logger.log(`[ResetPassword]:${user.username}`);

    return { username: user.username };
  }

  async generateAccessToken(
    user: Awaited<ReturnType<UsersService['findByUniqueWithDetail']>>,
  ): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      hasPassword: !!user.password,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      salary: user.salary,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      photoUrl: user.photoUrl,
      coverUrl: user.coverUrl,
      themeSource: user.themeSource,
      themeStyle: user.themeStyle,
      securityStamp: user.securityStamp,
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
            this.configService.get<number>('REFRESH_TOKEN_EXPIRES', 2592000),
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
    const user = await this.usersService.findByUniqueWithDetail({ username });
    if (!user?.password || !(await compare(password, user.password))) {
      return null;
    }

    return user;
  }

  async login(
    user: Awaited<ReturnType<UsersService['findByUniqueWithDetail']>>,
    ipAddress: string,
  ) {
    this.logger.log(`[Login]:${user.username}`);
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
        throw new AppError.Argument(messages.error.refreshToken);
      }

      const accessToken = await this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user.id, ip);
      await this.revokeRefreshToken(oldRefreshToken.id, ip, newRefreshToken);
      this.logger.log(`[RefreshToken]:${user.username}`);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  async revoke(token: string, userId: string, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const refreshToken = await tx.refreshToken.findFirst({
        select: {
          id: true,
          expires: true,
          revoked: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        where: { token },
      });

      if (!refreshToken) {
        throw new AppError.NotFound();
      }

      if (refreshToken.user.id !== userId) {
        throw new AppError.Argument(messages.error.refreshToken);
      }

      if (
        refreshToken.revoked ||
        moment(refreshToken.expires).isSameOrBefore()
      ) {
        throw new AppError.Argument(messages.error.refreshToken);
      }

      await this.revokeRefreshToken(refreshToken.id, ip);
      this.logger.log(`[RevokeToken]:${refreshToken.user.username}`);
    });
  }

  private getImageCacheKey(username: string, type: 'photo' | 'cover') {
    return `user:${username}:${type}`;
  }

  async getImageLink(dto: SearchImageDto, user: IdentityUser) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const result = await this.usersService.findByUnique({
      username: user.username,
    });

    if (!result) {
      throw new AppError.NotFound();
    }

    return this.cacheManager.wrap(
      this.getImageCacheKey(user.username, dto.type),
      () => this.dropboxService.getTemporaryLink(result[fieldName]),
      AuthFile.CACHE_TIME,
    );
  }

  async updateImage(image: IFile, dto: UpdateImageDto, user: IdentityUser) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const result = await this.dropboxService.fileUpload(image, {
      path: user.id,
      mode: { '.tag': 'overwrite' },
    });
    await this.cacheManager.del(this.getImageCacheKey(user.username, dto.type));

    const theme = dto.theme
      ? await this.materialDesignService.generateThemeFromImage(image)
      : {};

    await this.prisma.user.update({
      data: {
        [fieldName]: result.pathDisplay,
        ...theme,
      },
      where: {
        id: user.id,
      },
    });
  }

  async updateTheme(dto: UpdateThemeDto, user: IdentityUser) {
    const theme = !_.isNil(dto.source)
      ? await this.materialDesignService.generateThemeFromSource(dto.source)
      : { themeSource: null, themeStyle: null };

    await this.prisma.user.update({
      data: {
        ...theme,
      },
      where: {
        id: user.id,
      },
    });
    this.logger.log(`[UpdateTheme]:${user.username}`);
  }

  async updatePassword(
    dto: UpdatePasswordDto,
    userId: string,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      select: { username: true, password: true, securityStamp: true },
      where: { id: userId },
    });

    const hasPassword = !!user.password;

    if (
      hasPassword &&
      (!dto.currentPassword ||
        !(await compare(dto.currentPassword, user.password)))
    ) {
      throw new AppError.Argument(messages.error.currentPassword);
    }

    await this.prisma.user.update({
      data: {
        password: await this.hashPassword(dto.newPassword),
        securityStamp: Random.generateSecurityStamp(),
      },
      where: { id: userId },
    });
    this.logger.log(`[UpdatePassword]:${user.username}`);

    await this.redisService.db.zRem(
      SECURITY_STAMPS_REDIS_KEY,
      user.securityStamp,
    );

    return this.login(
      await this.usersService.findByUniqueWithDetail({ id: userId }),
      ipAddress,
    );
  }

  async requestVerifyEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      select: { id: true, username: true, email: true, emailConfirmed: true },
      where: { id: userId },
    });

    if (!user.email || user.emailConfirmed) {
      throw new AppError.Argument(messages.warning.requestVeriyEmail);
    }

    await this.sendConfirmEmail(user);
    this.logger.log(`[RequestVerifyEmail]:${user.username}`);
  }

  async updateEmail(dto: UpdateEmailDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      select: { id: true, username: true, email: true },
      where: { id: userId },
    });

    if (dto.email === user.email) {
      throw new AppError.Argument(messages.error.sameEmailAddressProvided);
    }

    await this.prisma.user.update({
      data: { email: dto.email, emailConfirmed: false },
      where: { id: user.id },
    });

    await this.sendConfirmEmail({
      id: user.id,
      username: user.username,
      email: dto.email,
    });
    this.logger.log(`[UpdateEmail]:${user.username}`);
  }

  async profilePdf(user: IdentityUser): Promise<Buffer> {
    const [
      {
        id,
        username,
        email,
        emailConfirmed,
        userRoles,
        createdAt,
        updatedAt,
        firstName,
        lastName,
        birthDate,
        salary,
      },
      photoSrc,
      coverSrc,
    ] = await Promise.all([
      this.usersService.findByUniqueWithDetail({
        username: user.username,
      }),
      this.getImageLink({ type: 'photo' }, user).catch(() =>
        Promise.resolve(null),
      ),
      this.getImageLink({ type: 'cover' }, user).catch(() =>
        Promise.resolve(null),
      ),
    ]);

    /**
     * @deprecated old code for base64 downloadImage
     */
    // const prefix = `data:image/png;base64,`;
    // const photoSrc = _.isNull(photoResult)
    //   ? null
    //   : `${prefix}${photoResult.buffer.toString('base64')}`;

    // const coverSrc = _.isNull(photoResult)
    //   ? null
    //   : `${prefix}${coverResult.buffer.toString('base64')}`;

    const html = await this.fileUtilsService.renderPdf('profile', {
      exportDate: `${moment().utc().format('YYYY-MM-DD HH:mm:ss')} (UTC)`,
      id,
      username,
      email,
      emailConfirmed,
      userRoles,
      photoSrc,
      createdAt: `${moment(createdAt)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss')} (UTC)`,
      updatedAt: `${moment(updatedAt)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss')} (UTC)`,
      coverSrc,
      firstName,
      lastName,
      birthDate: _.isNull(birthDate)
        ? null
        : `${moment(birthDate).utc().format('YYYY-MM-DD')}`,
      salary: _.isNull(salary) ? null : salary.toFixed(),
      supportUrl: this.configService.get<string>('SUPPORT_URL'),
      supportEmail: this.configService.get<string>('SENDGRID_SENDER'),
    });

    return this.fileUtilsService.exportPdf(html);
  }
}
