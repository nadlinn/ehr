import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { EhrQueueProcessor } from './queue.processor';
import { EhrIntegrationModule } from '../ehr-integrations/ehr-integration.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ehr-processing',
    }),
    EhrIntegrationModule,
  ],
  providers: [QueueService, EhrQueueProcessor],
  exports: [QueueService],
})
export class QueueModule {}
