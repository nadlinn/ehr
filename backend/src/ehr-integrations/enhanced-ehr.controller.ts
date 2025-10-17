import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { EnhancedEhrIntegrationService } from './enhanced-ehr-integration.service';
import { SendPatientDataDto } from './dto/patient-data.dto';

@Controller('ehr')
export class EnhancedEhrController {
  constructor(private readonly enhancedEhrIntegrationService: EnhancedEhrIntegrationService) {}

  // Synchronous processing (original)
  @Post('send-patient-data')
  @HttpCode(HttpStatus.OK)
  async sendPatientData(@Body() sendPatientDataDto: SendPatientDataDto) {
    return this.enhancedEhrIntegrationService.sendPatientData(
      sendPatientDataDto.ehrName,
      sendPatientDataDto.patientData,
      sendPatientDataDto.language
    );
  }

  // Asynchronous processing (new)
  @Post('send-patient-data-async')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendPatientDataAsync(@Body() sendPatientDataDto: SendPatientDataDto) {
    return this.enhancedEhrIntegrationService.sendPatientDataAsync(
      sendPatientDataDto.ehrName,
      sendPatientDataDto.patientData,
      sendPatientDataDto.language
    );
  }

  // Bulk processing (new)
  @Post('send-bulk-patient-data')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendBulkPatientData(@Body() bulkData: { jobs: SendPatientDataDto[] }) {
    return this.enhancedEhrIntegrationService.sendBulkPatientData(bulkData.jobs);
  }

  // Queue monitoring (new)
  @Get('queue/status')
  async getQueueStatus() {
    return this.enhancedEhrIntegrationService.getQueueStatus();
  }

  @Get('queue/job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.enhancedEhrIntegrationService.getJobStatus(jobId);
  }

  @Post('queue/retry/:jobId')
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('jobId') jobId: string) {
    await this.enhancedEhrIntegrationService.retryFailedJob(jobId);
    return { message: 'Job retry initiated' };
  }

  // Cache management (new)
  @Post('cache/invalidate/:ehrName')
  @HttpCode(HttpStatus.OK)
  async invalidateCache(@Param('ehrName') ehrName: string) {
    await this.enhancedEhrIntegrationService.invalidateEhrMappingCache(ehrName);
    return { message: `Cache invalidated for ${ehrName}` };
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearAllCaches() {
    await this.enhancedEhrIntegrationService.clearAllCaches();
    return { message: 'All caches cleared' };
  }

  // Original endpoints (enhanced)
  @Post('save-mapping')
  @HttpCode(HttpStatus.CREATED)
  async saveMapping(@Body() ehrMappingDto: any) {
    return this.enhancedEhrIntegrationService.saveEhrMapping(
      ehrMappingDto.ehrName,
      ehrMappingDto.mappingConfig
    );
  }

  @Get('mapping/:ehrName')
  async getMapping(@Param('ehrName') ehrName: string) {
    return this.enhancedEhrIntegrationService.getEhrMapping(ehrName);
  }

  @Get('transactions')
  async getTransactionLogs(
    @Query('ehrName') ehrName?: string,
    @Query('status') status?: string
  ) {
    return this.enhancedEhrIntegrationService.getTransactionLogs(ehrName, status);
  }

  @Post('retry-transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  async retryTransaction(@Param('transactionId') transactionId: number) {
    await this.enhancedEhrIntegrationService.retryFailedTransaction(transactionId);
    return { message: 'Transaction retry initiated' };
  }
}
