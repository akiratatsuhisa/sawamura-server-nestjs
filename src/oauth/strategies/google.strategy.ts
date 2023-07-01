import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AppError } from 'src/common/errors';
import { Oauth } from 'src/helpers/oauth.helper';

import { IGoogleProfile } from '../interfaces';
import { OauthService } from '../oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private oauthService: OauthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: IGoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const state = Oauth.parseState(req.query.state);
      req.query.redirectUrl = state.redirectUrl;

      const user = await this.oauthService.validateGoogleProvider(
        profile,
        state.token,
      );

      if (!user) {
        throw AppError.Messages.NotFoundError;
      }

      done(null, user);
    } catch (error: unknown) {
      throw new AppError.OauthError(
        typeof error === 'string' ? error : undefined,
      );
    }
  }
}
