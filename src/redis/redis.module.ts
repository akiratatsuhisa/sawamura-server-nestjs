import { Global, Module } from '@nestjs/common';

import { redisProviders } from './redis.provider';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [...redisProviders, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
