import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { EhrIntegrationService } from './ehr-integration.service';
import { SendPatientDataDto, EhrMappingDto } from './dto/patient-data.dto';

@Controller('ehr')
export class EhrController {
  constructor(private readonly ehrIntegrationService: EhrIntegrationService) {}

  @Post('send-patient-data')
  @HttpCode(HttpStatus.OK)
  async sendPatientData(@Body() sendPatientDataDto: SendPatientDataDto) {
    return this.ehrIntegrationService.sendPatientData(
      sendPatientDataDto.ehrName,
      sendPatientDataDto.patientData
    );
  }

  @Post('save-mapping')
  @HttpCode(HttpStatus.CREATED)
  async saveMapping(@Body() ehrMappingDto: EhrMappingDto) {
    return this.ehrIntegrationService.saveEhrMapping(
      ehrMappingDto.ehrName,
      ehrMappingDto.mappingConfig
    );
  }

  @Get('mapping/:ehrName')
  async getMapping(@Param('ehrName') ehrName: string) {
    return this.ehrIntegrationService.getEhrMapping(ehrName);
  }

  @Get('transactions')
  async getTransactionLogs(
    @Query('ehrName') ehrName?: string,
    @Query('status') status?: string
  ) {
    return this.ehrIntegrationService.getTransactionLogs(ehrName, status);
  }

  @Post('retry-transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  async retryTransaction(@Param('transactionId') transactionId: number) {
    return this.ehrIntegrationService.retryFailedTransaction(transactionId);
  }
}
