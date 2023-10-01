import { Module } from '@nestjs/common';

import { WhinniesController } from './whinnies.controller';
import { WhinniesService } from './whinnies.service';

@Module({
  controllers: [WhinniesController],
  providers: [WhinniesService],
})
export class WhinniesModule {}
