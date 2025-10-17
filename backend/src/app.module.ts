import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EhrIntegrationModule } from './ehr-integrations/ehr-integration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    DatabaseModule,
    EhrIntegrationModule,
    AppCacheModule,
    QueueModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
