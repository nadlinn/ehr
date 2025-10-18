import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { EhrIntegrationService } from './ehr-integration.service';
import { MultiEndpointEhrService } from './multi-endpoint-ehr.service';
import { AthenaModule } from './athena/athena.module';
import { AllscriptsModule } from './allscripts/allscripts.module';
import { EhrController } from './ehr.controller';
import { MultiEndpointEhrController } from './multi-endpoint-ehr.controller';

@Module({
  imports: [
    AthenaModule, 
    AllscriptsModule, 
    TypeOrmModule.forFeature([EhrMapping, TransactionLog])
  ],
  providers: [EhrIntegrationService, MultiEndpointEhrService],
  controllers: [EhrController, MultiEndpointEhrController],
  exports: [EhrIntegrationService, MultiEndpointEhrService],
})
export class EhrIntegrationModule {}

