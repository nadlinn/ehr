import { Module } from '@nestjs/common';
import { AllscriptsStrategy } from './allscripts.strategy';
import { AllscriptsMappingService } from './allscripts.mapping.service';

@Module({
  providers: [AllscriptsStrategy, AllscriptsMappingService],
  exports: [AllscriptsStrategy],
})
export class AllscriptsModule {}

