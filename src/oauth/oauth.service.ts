import { Injectable } from '@nestjs/common';
import { VerificationTokenType } from '@prisma/client';
import querystring from 'querystring';
import { AuthService } from 'src/auth/auth.service';
import { IdentityUser } from 'src/auth/identity.class';
import { AppError } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { userDetailSelect } from 'src/users/users.factory';
import { UsersService } from 'src/users/users.service';
import { Random } from 'src/utils';
import { VerificationTokensService } from 'src/verification-tokens/verification-tokens.service';

import { LinkProviderDto, UnlinkProviderDto } from './dtos';
import { IGithubProfile, IGoogleProfile } from './interfaces';

@Injectable()
export class OauthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private authService: AuthService,
    private verificationTokensService: VerificationTokensService,
  ) {}

  async findProviders(user: IdentityUser) {
    return this.prisma.userLogins.findMany({
      select: {
        providerName: true,
      },
      where: {
        userId: user.id,
      },
    });
  }

  async login(
    user: Awaited<ReturnType<UsersService['findByUniqueWithDetail']>>,
    ipAddress: string,
    redirectUrl?: string,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      user,
      ipAddress,
    );

    return `${
      process.env.OAUTH_CLIENT_URL
    }/oauth/callback?${querystring.stringify({
      accessToken,
      refreshToken,
      redirectUrl,
    })}`;
  }

  private generateUsername() {
    return `oauth_${Random.generateWords(10, false)}`;
  }

  async validateGoogleProvider(profile: IGoogleProfile, token?: string) {
    const provider = 'google';

    if (token) {
      await this.linkProvider({
        token,
        providerName: provider,
        providerKey: profile.id,
      });
    }

    const user = await this.usersService.findByProvider(provider, profile.id);

    if (token && !user) {
      throw AppError.Messages.OauthServerError;
    }

    if (user) {
      return user;
    }

    const username = this.generateUsername();
    const email = profile.emails.at(0);

    return this.prisma.user.create({
      data: {
        username: username,
        displayName: profile?.displayName ?? username,
        email: email.value,
        emailConfirmed: email.verified,
        firstName: profile?.name?.givenName,
        lastName: profile?.name?.familyName,
        userRoles: {
          create: [
            {
              role: {
                connect: { name: 'User' },
              },
            },
          ],
        },
        userLogins: {
          create: [
            {
              providerName: provider,
              providerKey: profile.id,
            },
          ],
        },
        securityStamp: Random.generateSecurityStamp(),
      },
      select: userDetailSelect,
    });
  }

  async validateGithubProvider(profile: IGithubProfile, token?: string) {
    const provider = 'github';

    if (token) {
      await this.linkProvider({
        token,
        providerName: provider,
        providerKey: profile.id,
      });
    }

    const user = await this.usersService.findByProvider(provider, profile.id);

    if (token && !user) {
      throw AppError.Messages.OauthServerError;
    }

    if (user) {
      return user;
    }

    const username = this.generateUsername();

    return this.prisma.user.create({
      data: {
        username: username,
        displayName: profile?.displayName ?? username,
        userRoles: {
          create: [
            {
              role: {
                connect: { name: 'User' },
              },
            },
          ],
        },
        userLogins: {
          create: [
            {
              providerName: provider,
              providerKey: profile.id,
            },
          ],
        },
        securityStamp: Random.generateSecurityStamp(),
      },
      select: userDetailSelect,
    });
  }

  async generateToken(user: IdentityUser) {
    const verificationToken =
      await this.verificationTokensService.generateToken(
        user.id,
        VerificationTokenType.LinkProviderLogin,
      );

    return {
      token: verificationToken.token,
    };
  }

  async linkProvider(dto: LinkProviderDto) {
    const verificationToken =
      await this.verificationTokensService.getTokenActive(
        dto.token,
        VerificationTokenType.LinkProviderLogin,
      );

    const countDupplicate = await this.prisma.userLogins.count({
      where: {
        providerName: dto.providerName,
        providerKey: dto.providerKey,
      },
    });

    if (countDupplicate) {
      throw AppError.Messages.ProviderAlreadyLinked;
    }

    await this.prisma.userLogins.create({
      data: {
        providerName: dto.providerName,
        providerKey: dto.providerKey,
        userId: verificationToken.userId,
      },
    });

    await this.verificationTokensService.revokeToken(
      dto.token,
      VerificationTokenType.LinkProviderLogin,
    );
  }

  async unlinkProvider(dto: UnlinkProviderDto, user: IdentityUser) {
    await this.prisma.userLogins.delete({
      where: {
        userId_providerName: {
          providerName: dto.provider,
          userId: user.id,
        },
      },
    });
  }
}
