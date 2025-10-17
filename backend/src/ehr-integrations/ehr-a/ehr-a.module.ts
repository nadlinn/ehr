import { Module } from '@nestjs/common';
import { EhrAStrategy } from './ehr-a.strategy';
import { EhrAMappingService } from './ehr-a.mapping.service';

@Module({
  providers: [EhrAStrategy, EhrAMappingService],
  exports: [EhrAStrategy],
})
export class EhrAModule {}

