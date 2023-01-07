import { Inject, Injectable } from '@nestjs/common';

import { REDIS, RedisClientType } from './redis.provider';
import { BucketType } from './redis.type';

@Injectable()
export class RedisService {
  public db: RedisClientType;

  constructor(@Inject(REDIS) private redis: RedisClientType) {
    this.db = redis;
  }

  private getBucketById(bucket: string, id: number) {
    return {
      key: `${bucket}:${Math.ceil(Number(id) / 1000)}`,
      field: id?.toString() ?? '',
    };
  }

  async hGetBucket<T extends BucketType>(
    bucket: string,
    id: number,
    callback: undefined,
  ): Promise<T | undefined>;
  async hGetBucket<T extends BucketType>(
    bucket: string,
    id: number,
    callback: () => T | Promise<T>,
  ): Promise<T> {
    const { key, field } = this.getBucketById(bucket, id);

    const cache = await this.redis.hGet(key, field);

    if (!callback) {
      return cache === undefined ? undefined : (JSON.parse(cache) as T);
    }

    const data = await Promise.resolve(callback());
    await this.hSetBucket(bucket, id, data);
    return data;
  }

  async hSetBucket<T extends BucketType>(
    bucket: string,
    id: number,
    data: T,
  ): Promise<void> {
    const { key, field } = this.getBucketById(bucket, id);

    await this.redis.hSet(key, field, JSON.stringify(data));
  }

  async hDelBucket(bucket: string, id: number): Promise<void> {
    const { key, field } = this.getBucketById(bucket, id);

    await this.redis.hDel(key, field);
  }
}
