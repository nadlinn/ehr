import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EhrIntegrationModule } from './ehr-integrations/ehr-integration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCacheModule } from './cache/cache.module';
import { PostgresQueueModule } from './queue/postgres-queue.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    DatabaseModule,
    EhrIntegrationModule,
    AppCacheModule,
    PostgresQueueModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
