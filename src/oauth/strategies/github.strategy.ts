import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-github';
import { AppError } from 'src/common/errors';
import { Oauth } from 'src/helpers/oauth.helper';

import { IGithubProfile } from '../interfaces';
import { OauthService } from '../oauth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    private oauthService: OauthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      redirectUrl: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'read:user'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: IGithubProfile,
  ): Promise<any> {
    try {
      const state = Oauth.parseState(req.query.state);
      req.query.redirectUrl = state.redirectUrl;

      const user = await this.oauthService.validateGithubProvider(
        profile,
        state.token,
      );

      if (!user) {
        throw AppError.Messages.NotFoundError;
      }

      return user;
    } catch (error: unknown) {
      throw new AppError.OauthError(
        typeof error === 'string' ? error : undefined,
      );
    }
  }
}
