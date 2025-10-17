import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { EhrIntegrationService } from './ehr-integration.service';
import { AthenaModule } from './athena/athena.module';
import { AllscriptsModule } from './allscripts/allscripts.module';
import { EhrController } from './ehr.controller';

@Module({
  imports: [
    AthenaModule, 
    AllscriptsModule, 
    TypeOrmModule.forFeature([EhrMapping, TransactionLog])
  ],
  providers: [EhrIntegrationService],
  controllers: [EhrController],
  exports: [EhrIntegrationService],
})
export class EhrIntegrationModule {}

