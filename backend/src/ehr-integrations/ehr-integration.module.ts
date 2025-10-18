import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { MultiEndpointEhrService } from './multi-endpoint-ehr.service';
import { AthenaModule } from './athena/athena.module';
import { AllscriptsModule } from './allscripts/allscripts.module';
import { MultiEndpointEhrController } from './multi-endpoint-ehr.controller';
import { I18nService } from '../i18n/i18n.service';
import { AppCacheModule } from '../cache/cache.module';
import { PostgresQueueModule } from '../queue/postgres-queue.module';

@Module({
  imports: [
    AthenaModule, 
    AllscriptsModule, 
    TypeOrmModule.forFeature([EhrMapping, TransactionLog]),
    AppCacheModule,
    PostgresQueueModule
  ],
  providers: [
    MultiEndpointEhrService,
    I18nService
  ],
  controllers: [MultiEndpointEhrController],
  exports: [MultiEndpointEhrService],
})
export class EhrIntegrationModule {}

