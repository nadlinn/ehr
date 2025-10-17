import { Module } from '@nestjs/common';
import { AthenaStrategy } from './athena.strategy';
import { AthenaMappingService } from './athena.mapping.service';

@Module({
  providers: [AthenaStrategy, AthenaMappingService],
  exports: [AthenaStrategy],
})
export class AthenaModule {}

