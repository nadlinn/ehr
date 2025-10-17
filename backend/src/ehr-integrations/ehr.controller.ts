import { Controller, Post, Body } from '@nestjs/common';
import { EhrIntegrationService } from './ehr-integration.service';

@Controller('ehr')
export class EhrController {
  constructor(private readonly ehrIntegrationService: EhrIntegrationService) {}

  @Post('send-patient-data')
  async sendPatientData(
    @Body('ehrName') ehrName: string,
    @Body('patientData') patientData: any,
  ) {
    return this.ehrIntegrationService.sendPatientData(ehrName, patientData);
  }

  @Post('save-mapping')
  async saveMapping(
    @Body('ehrName') ehrName: string,
    @Body('mappingConfig') mappingConfig: any,
  ) {
    return this.ehrIntegrationService.saveEhrMapping(ehrName, mappingConfig);
  }

  @Post('get-mapping')
  async getMapping(
    @Body('ehrName') ehrName: string,
  ) {
    return this.ehrIntegrationService.getEhrMapping(ehrName);
  }
}
