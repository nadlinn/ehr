import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EhrIntegrationModule } from './ehr-integrations/ehr-integration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [EhrIntegrationModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
