import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VerificationTokensModule } from 'src/verification-tokens/verification-tokens.module';

import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { GithubStrategy, GoogleStrategy } from './strategies';

@Module({
  imports: [UsersModule, AuthModule, VerificationTokensModule],
  providers: [OauthService, GoogleStrategy, GithubStrategy],
  controllers: [OauthController],
})
export class OauthModule {}
