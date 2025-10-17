import { Module } from '@nestjs/common';
import { EhrBStrategy } from './ehr-b.strategy';
import { EhrBMappingService } from './ehr-b.mapping.service';

@Module({
  providers: [EhrBStrategy, EhrBMappingService],
  exports: [EhrBStrategy],
})
export class EhrBModule {}

