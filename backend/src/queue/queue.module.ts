import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { EhrQueueProcessor } from './queue.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EhrMapping } from '../ehr-integrations/ehr-mapping.entity';
import { TransactionLog } from '../ehr-integrations/entities/transaction-log.entity';
import { AthenaModule } from '../ehr-integrations/athena/athena.module';
import { AllscriptsModule } from '../ehr-integrations/allscripts/allscripts.module';
import { MultiEndpointEhrService } from '../ehr-integrations/multi-endpoint-ehr.service';
import { I18nService } from '../i18n/i18n.service';
import { AppCacheModule } from '../cache/cache.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ehr-processing',
    }),
    TypeOrmModule.forFeature([EhrMapping, TransactionLog]),
    AthenaModule,
    AllscriptsModule,
    AppCacheModule,
  ],
  providers: [
    QueueService, 
    EhrQueueProcessor,
    MultiEndpointEhrService,
    I18nService
  ],
  exports: [QueueService],
})
export class QueueModule {}
