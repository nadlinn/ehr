import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 3600, // Default TTL in seconds
      max: 1000, // Maximum number of items in cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
