import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { EhrIntegrationService } from './ehr-integration.service';
import { EhrAModule } from './ehr-a/ehr-a.module';
import { EhrBModule } from './ehr-b/ehr-b.module';
import { EhrController } from './ehr.controller';

@Module({
  imports: [EhrAModule, EhrBModule, TypeOrmModule.forFeature([EhrMapping])],
  providers: [EhrIntegrationService],
  controllers: [EhrController],
  exports: [EhrIntegrationService],
})
export class EhrIntegrationModule {}

