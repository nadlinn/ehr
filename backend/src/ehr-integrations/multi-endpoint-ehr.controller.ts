import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { MultiEndpointEhrService } from './multi-endpoint-ehr.service';
import { SendPatientDataDto } from './dto/patient-data.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('ehr/multi-endpoint')
export class MultiEndpointEhrController {
  constructor(private readonly multiEndpointEhrService: MultiEndpointEhrService) {}

  /**
   * Sends patient data to multiple endpoints of an EHR system synchronously.
   */
  @Post('send-patient-data')
  @HttpCode(HttpStatus.OK)
  async sendPatientDataToMultipleEndpoints(@Body() sendPatientDataDto: SendPatientDataDto) {
    return this.multiEndpointEhrService.sendPatientDataToMultipleEndpoints(sendPatientDataDto);
  }

  /**
   * Sends patient data to multiple endpoints of an EHR system asynchronously.
   */
  @Post('send-patient-data-async')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendPatientDataToMultipleEndpointsAsync(@Body() sendPatientDataDto: SendPatientDataDto) {
    return this.multiEndpointEhrService.sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto);
  }

  /**
   * Gets available endpoints for an EHR system.
   */
  @Get('endpoints/:ehrName')
  @CacheKey('ehr_endpoints_key')
  @CacheTTL(3600)
  @UseInterceptors(CacheInterceptor)
  async getEhrEndpoints(@Param('ehrName') ehrName: string) {
    return this.multiEndpointEhrService.getEhrEndpoints(ehrName);
  }

  /**
   * Gets field mappings for a specific endpoint.
   */
  @Get('endpoints/:ehrName/:endpointName/mappings')
  @CacheKey('ehr_endpoint_mappings_key')
  @CacheTTL(3600)
  @UseInterceptors(CacheInterceptor)
  async getEndpointFieldMappings(
    @Param('ehrName') ehrName: string,
    @Param('endpointName') endpointName: string
  ) {
    return this.multiEndpointEhrService.getEndpointFieldMappings(ehrName, endpointName);
  }
}
