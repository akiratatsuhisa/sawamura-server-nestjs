import { Module } from '@nestjs/common';

import { VerificationTokensService } from './verification-tokens.service';

@Module({
  providers: [VerificationTokensService],
  exports: [VerificationTokensService],
})
export class VerificationTokensModule {}
